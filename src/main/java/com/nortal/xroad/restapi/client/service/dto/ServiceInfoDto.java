package com.nortal.xroad.restapi.client.service.dto;

import java.util.List;

public record ServiceInfoDto(
    String serviceCode,
    String serviceType,
    List<EndpointDto> endpoints
) {
    public record EndpointDto(
        String method,
        String path
    ) {}
}
