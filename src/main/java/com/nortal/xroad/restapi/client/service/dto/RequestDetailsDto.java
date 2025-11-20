package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.Collections;
import java.util.Map;
import org.springframework.http.HttpMethod;

public record RequestDetailsDto(
    @NotNull(message = "HTTP method is required") HttpMethod method,
    @NotBlank(message = "Path is required")
    @Pattern(regexp = "^/[A-Za-z0-9/_-]*$", message = "Must be valid URI path starting with /")
    String path,
    Map<String, String> queryParams,
    Map<String, String> headers,
    String body,
    String contentType,
    String xroadId,
    String xroadUserId,
    String xroadIssue,
    String xroadRepresentedParty
) {
    // Compact constructor for default values
    public RequestDetailsDto {
        if (queryParams == null) {
            queryParams = Collections.emptyMap();
        }
        if (headers == null) {
            headers = Collections.emptyMap();
        }
    }
}
