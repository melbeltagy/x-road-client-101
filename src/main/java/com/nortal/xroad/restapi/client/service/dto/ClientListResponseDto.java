package com.nortal.xroad.restapi.client.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Response DTO for X-Road security server listClients endpoint.
 */
public record ClientListResponseDto(List<MemberEntry> member) {

    public record MemberEntry(MemberId id) {}

    public record MemberId(
        @JsonProperty("object_type") String objectType,
        @JsonProperty("xroad_instance") String xroadInstance,
        @JsonProperty("member_class") String memberClass,
        @JsonProperty("member_code") String memberCode,
        @JsonProperty("subsystem_code") String subsystemCode
    ) {}
}
