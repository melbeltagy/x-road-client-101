package com.nortal.xroad.restapi.client.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Response DTO for X-Road security server listMethods endpoint.
 */
public record ServiceListResponseDto(List<ServiceEntry> service) {

    public record ServiceEntry(
        @JsonProperty("service_code") String serviceCode,
        @JsonProperty("service_type") String serviceType,
        @JsonProperty("endpoint_list") List<EndpointEntry> endpointList
    ) {}

    public record EndpointEntry(String method, String path) {}
}
