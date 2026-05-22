package com.nortal.xroad.restapi.client.service.mapper;

import com.nortal.xroad.restapi.client.service.dto.RequestDetailsDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class XRoadRequestMapper {

    private static final String HEADER_X_ROAD_CLIENT = "X-Road-Client";
    private static final String HEADER_X_ROAD_REQUEST_ID = "X-Road-Request-Id";
    private static final String HEADER_CONTENT_TYPE = "Content-Type";

    public String buildUrl(XRoadRequestDTO request) {
        String baseUrl = request.client().securityServerUrl();
        String servicePath = buildServicePath(request);

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(baseUrl).path(servicePath);

        if (request.request().queryParams() != null) {
            request.request().queryParams().forEach(uriBuilder::queryParam);
        }

        return uriBuilder.build().toUriString();
    }

    public void addHeaders(HttpHeaders headers, XRoadRequestDTO request) {
        SubsystemIdDto client = request.client().subsystem();
        headers.set(HEADER_X_ROAD_CLIENT, formatClientHeader(client));
        headers.set(HEADER_X_ROAD_REQUEST_ID, UUID.randomUUID().toString());

        RequestDetailsDto details = request.request();
        addContentTypeHeader(headers, details);
        addCustomHeaders(headers, details);
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

    private String formatClientHeader(SubsystemIdDto subsystem) {
        return String.format(
            "%s/%s/%s/%s",
            subsystem.instanceId(),
            subsystem.memberClass(),
            subsystem.memberCode(),
            subsystem.subsystemCode()
        );
    }

    private void addContentTypeHeader(HttpHeaders headers, RequestDetailsDto details) {
        String contentType = details.contentType();
        if (StringUtils.isBlank(contentType) && details.headers() != null) {
            contentType = details.headers().get(HEADER_CONTENT_TYPE);
        }
        if (StringUtils.isNotBlank(contentType)) {
            headers.set(HEADER_CONTENT_TYPE, contentType);
        }
    }

    private void addCustomHeaders(HttpHeaders headers, RequestDetailsDto details) {
        if (details.headers() == null) {
            return;
        }
        details.headers().forEach((key, value) -> {
            if (!HEADER_CONTENT_TYPE.equalsIgnoreCase(key)) {
                headers.set(key, value);
            }
        });
    }
}
