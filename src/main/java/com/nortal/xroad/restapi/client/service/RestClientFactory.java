package com.nortal.xroad.restapi.client.service;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.MTLsCertificatesDto;
import com.nortal.xroad.restapi.client.service.util.MTLSContextBuilder;
import java.net.http.HttpClient;
import java.time.Duration;
import javax.net.ssl.SSLContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class RestClientFactory {

    private final ApplicationProperties applicationProperties;
    private final RestClient.Builder restClientBuilder;

    public RestClient create(ClientDto client) {
        Duration connectTimeout = Duration.ofMillis(applicationProperties.getXroad().getTimeout().getConnectMs());
        Duration readTimeout = Duration.ofMillis(applicationProperties.getXroad().getTimeout().getReadMs());

        HttpClient.Builder httpClientBuilder = HttpClient.newBuilder()
            .connectTimeout(connectTimeout);

        if (hasMtlsCertificates(client)) {
            MTLsCertificatesDto certs = client.mtlsCertificates();
            log.debug("Configuring mTLS for RestClient");
            SSLContext sslContext = MTLSContextBuilder.createSslContext(
                certs.securityServerCert(),
                certs.clientCert(),
                certs.clientPrivateKey()
            );
            httpClientBuilder.sslContext(sslContext);
        }

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClientBuilder.build());
        requestFactory.setReadTimeout(readTimeout);

        return restClientBuilder.clone()
            .requestFactory(requestFactory)
            .build();
    }

    private boolean hasMtlsCertificates(ClientDto client) {
        if (client.mtlsCertificates() == null) {
            return false;
        }
        MTLsCertificatesDto certs = client.mtlsCertificates();
        return StringUtils.isNoneBlank(
            certs.securityServerCert(),
            certs.clientCert(),
            certs.clientPrivateKey()
        );
    }
}
