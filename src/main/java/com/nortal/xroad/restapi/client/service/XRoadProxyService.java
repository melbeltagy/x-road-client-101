package com.nortal.xroad.restapi.client.service;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.MTlsCertificatesDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import com.nortal.xroad.restapi.client.service.mapper.XRoadResponseMapper;
import com.nortal.xroad.restapi.client.service.util.MTLSContextBuilder;
import com.nortal.xroad.restapi.client.service.util.XRoadHeaderBuilder;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

/**
 * Service for proxying X-Road requests to Security Server with mTLS support.
 */
@Service
public class XRoadProxyService {

    private static final Logger log = LoggerFactory.getLogger(XRoadProxyService.class);

    private final ApplicationProperties applicationProperties;
    private final XRoadResponseMapper responseMapper;

    public XRoadProxyService(ApplicationProperties applicationProperties, XRoadResponseMapper responseMapper) {
        this.applicationProperties = applicationProperties;
        this.responseMapper = responseMapper;
    }

    /**
     * Execute X-Road request through Security Server.
     *
     * @param request the X-Road request
     * @return Mono containing the X-Road response
     */
    public Mono<XRoadResponseDTO> executeRequest(XRoadRequestDTO request) {
        log.debug("Executing X-Road request to service: {}", request.service().serviceCode());

        // Build URL for X-Road REST message protocol
        String url = buildXRoadUrl(request);
        log.debug("X-Road URL: {}", url);

        // Create WebClient with dynamic SSL context (if PEM certificates provided)
        WebClient webClient = createWebClient(request.client());

        // Execute request
        return webClient
            .method(request.request().method())
            .uri(url)
            .headers(headers -> {
                // Add X-Road protocol headers
                XRoadHeaderBuilder.addXRoadHeaders(headers, request.client().subsystem());

                // T076: Add optional X-Road headers if provided
                if (request.request().xroadId() != null && !request.request().xroadId().isBlank()) {
                    headers.set("X-Road-Id", request.request().xroadId());
                }
                if (request.request().xroadUserId() != null && !request.request().xroadUserId().isBlank()) {
                    headers.set("X-Road-UserId", request.request().xroadUserId());
                }
                if (request.request().xroadIssue() != null && !request.request().xroadIssue().isBlank()) {
                    headers.set("X-Road-Issue", request.request().xroadIssue());
                }
                if (request.request().xroadRepresentedParty() != null && !request.request().xroadRepresentedParty().isBlank()) {
                    headers.set("X-Road-Represented-Party", request.request().xroadRepresentedParty());
                }

                // T073: Add Content-Type header if provided (check both contentType field and custom headers)
                String contentType = request.request().contentType();
                if ((contentType == null || contentType.isBlank()) && request.request().headers() != null) {
                    contentType = request.request().headers().get("Content-Type");
                }
                if (contentType != null && !contentType.isBlank()) {
                    headers.setContentType(org.springframework.http.MediaType.parseMediaType(contentType));
                }

                // Add custom headers from request (excluding Content-Type which is handled above)
                if (request.request().headers() != null) {
                    request
                        .request()
                        .headers()
                        .forEach((key, value) -> {
                            if (!"Content-Type".equalsIgnoreCase(key)) {
                                headers.set(key, value);
                            }
                        });
                }
            })
            .bodyValue(request.request().body() != null ? request.request().body() : "")
            .exchangeToMono(response ->
                response
                    .bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .map(body -> responseMapper.toDto(response, body))
            );
    }

    /**
     * Build X-Road URL according to REST message protocol.
     * Format: {securityServerUrl}/r1/{service.instanceId}/{service.memberClass}/{service.memberCode}/{service.subsystemCode}/{service.serviceCode}[/{service.serviceVersion}]{request.path}
     */
    private String buildXRoadUrl(XRoadRequestDTO request) {
        SubsystemIdDto service = request.service().subsystem();
        String baseUrl = request.client().securityServerUrl();

        // Build service path
        StringBuilder servicePath = new StringBuilder("/r1/")
            .append(service.instanceId())
            .append("/")
            .append(service.memberClass())
            .append("/")
            .append(service.memberCode())
            .append("/")
            .append(service.subsystemCode())
            .append("/")
            .append(request.service().serviceCode());

        // Add service version if provided
        if (request.service().serviceVersion() != null && !request.service().serviceVersion().isBlank()) {
            servicePath.append("/").append(request.service().serviceVersion());
        }

        // Add request path
        servicePath.append(request.request().path());

        // Build complete URL with query parameters
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(baseUrl).path(servicePath.toString());

        if (request.request().queryParams() != null) {
            request.request().queryParams().forEach(builder::queryParam);
        }

        return builder.build().toUriString();
    }

    /**
     * Create WebClient with dynamic SSL context from PEM certificates.
     */
    private WebClient createWebClient(ClientDto client) {
        int readTimeoutMs = applicationProperties.getXroad().getTimeout().getReadMs();

        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofMillis(readTimeoutMs))
            .doOnConnected(conn ->
                conn
                    .addHandlerLast(new ReadTimeoutHandler(readTimeoutMs, TimeUnit.MILLISECONDS))
                    .addHandlerLast(new WriteTimeoutHandler(readTimeoutMs, TimeUnit.MILLISECONDS))
            );

        // Configure mTLS if certificates provided
        if (client.mtlsCertificates() != null) {
            MTlsCertificatesDto certs = client.mtlsCertificates();
            if (
                certs.securityServerCert() != null &&
                !certs.securityServerCert().isBlank() &&
                certs.clientCert() != null &&
                !certs.clientCert().isBlank() &&
                certs.clientPrivateKey() != null &&
                !certs.clientPrivateKey().isBlank()
            ) {
                log.debug("Configuring mTLS with separate certificate files");
                try {
                    // Create SSL context with separate security server cert, client cert, and client private key
                    SslContext sslContext = MTLSContextBuilder.createSslContext(
                        certs.securityServerCert(),
                        certs.clientCert(),
                        certs.clientPrivateKey()
                    );
                    httpClient = httpClient.secure(sslSpec ->
                        sslSpec
                            .sslContext(sslContext)
                            .handlerConfigurator(sslHandler -> {
                                // IMPORTANT: Disable hostname verification for development/testing only
                                // In production, hostname verification should be enabled
                                SSLEngine sslEngine = sslHandler.engine();
                                // Disable endpoint identification (hostname verification)
                                javax.net.ssl.SSLParameters sslParameters = sslEngine.getSSLParameters();
                                sslParameters.setEndpointIdentificationAlgorithm(null);
                                sslEngine.setSSLParameters(sslParameters);
                            })
                    );
                } catch (IllegalArgumentException e) {
                    log.error("Failed to create SSL context from PEM certificates", e);
                    throw e;
                }
            }
        }

        ReactorClientHttpConnector connector = new ReactorClientHttpConnector(httpClient);

        return WebClient.builder().clientConnector(connector).build();
    }
}
