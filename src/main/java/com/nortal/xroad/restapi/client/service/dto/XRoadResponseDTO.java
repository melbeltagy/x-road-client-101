package com.nortal.xroad.restapi.client.service.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record XRoadResponseDTO(
    Integer statusCode,
    String statusText,
    Map<String, List<String>> headers,
    String body,
    String contentType,
    Long contentLength,
    String xroadId,
    String xroadRequestHash,
    String xroadRequestId,
    XRoadErrorDTO xroadError,
    Instant timestamp
) {}
