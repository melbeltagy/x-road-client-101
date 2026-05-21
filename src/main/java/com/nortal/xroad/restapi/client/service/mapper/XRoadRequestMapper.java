package com.nortal.xroad.restapi.client.service.mapper;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.RequestDetailsDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import java.net.URI;
import java.net.http.HttpRequest;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class XRoadRequestMapper {

    private static final String HEADER_X_ROAD_CLIENT = "X-Road-Client";
    private static final String HEADER_X_ROAD_REQUEST_ID = "X-Road-Request-Id";
    private static final String HEADER_CONTENT_TYPE = "Content-Type";

    private final ApplicationProperties applicationProperties;

    public HttpRequest toHttpRequest(XRoadRequestDTO request) {
        String url = buildUrl(request);

        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofMillis(applicationProperties.getXroad().getTimeout().getReadMs()));

        addHeaders(builder, request);
        addMethod(builder, request.request());

        return builder.build();
    }

    private String buildUrl(XRoadRequestDTO request) {
        String baseUrl = request.client().securityServerUrl();

        String servicePath = buildServicePath(request);

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(baseUrl).path(servicePath);

        request.request().queryParams().forEach(uriBuilder::queryParam);

        return uriBuilder.build().toUriString();
    }

    private String buildServicePath(XRoadRequestDTO request) {
        SubsystemIdDto service = request.service().subsystem();
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

        if (StringUtils.isNotBlank(request.service().serviceVersion())) {
            servicePath.append("/").append(request.service().serviceVersion());
        }
        servicePath.append(request.request().path());
        return servicePath.toString();
    }

    private void addHeaders(HttpRequest.Builder builder, XRoadRequestDTO request) {
        SubsystemIdDto client = request.client().subsystem();
        builder.header(HEADER_X_ROAD_CLIENT, formatClientHeader(client));
        builder.header(HEADER_X_ROAD_REQUEST_ID, UUID.randomUUID().toString());

        RequestDetailsDto details = request.request();
        addContentTypeHeader(builder, details);
        addCustomHeaders(builder, details);
    }

    private String formatClientHeader(SubsystemIdDto subsystem) {
        return String.format(
            "%s/%s/%s/%s",
            subsystem.instanceId(),
            subsystem.memberClass(),
            subsystem.memberCode(),
            subsystem.subsystemCode()
        );
    }

    private void addContentTypeHeader(HttpRequest.Builder builder, RequestDetailsDto details) {
        String contentType = details.contentType();
        if (StringUtils.isBlank(contentType) && details.headers() != null) {
            contentType = details.headers().get(HEADER_CONTENT_TYPE);
        }
        if (StringUtils.isNotBlank(contentType)) {
            builder.header(HEADER_CONTENT_TYPE, contentType);
        }
    }

    private void addCustomHeaders(HttpRequest.Builder builder, RequestDetailsDto details) {
        if (details.headers() == null) {
            return;
        }
        details
            .headers()
            .forEach((key, value) -> {
                if (!HEADER_CONTENT_TYPE.equalsIgnoreCase(key)) {
                    builder.header(key, value);
                }
            });
    }

    private void addMethod(HttpRequest.Builder builder, RequestDetailsDto details) {
        String body = details.body() != null ? details.body() : "";
        builder.method(details.method().name(), HttpRequest.BodyPublishers.ofString(body));
    }
}
