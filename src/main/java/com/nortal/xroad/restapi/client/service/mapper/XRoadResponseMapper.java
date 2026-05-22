package com.nortal.xroad.restapi.client.service.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nortal.xroad.restapi.client.service.dto.XRoadErrorDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;

@Component
public class XRoadResponseMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public XRoadResponseDTO toDto(ClientHttpResponse response) throws IOException {
        int statusCode = response.getStatusCode().value();
        String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);

        return new XRoadResponseDTO(
            statusCode,
            getStatusText(statusCode),
            mapHeaders(response),
            body,
            extractHeader(response, "Content-Type"),
            extractContentLength(response),
            extractHeader(response, "X-Road-Id"),
            extractHeader(response, "X-Road-Request-Hash"),
            extractHeader(response, "X-Road-Request-Id"),
            parseXRoadError(response),
            Instant.now()
        );
    }

    private Map<String, List<String>> mapHeaders(ClientHttpResponse response) {
        Map<String, List<String>> headers = new java.util.HashMap<>();
        response.getHeaders().forEach((key, values) -> headers.put(key, new java.util.ArrayList<>(values)));
        return headers;
    }

    private String getStatusText(int statusCode) {
        HttpStatus httpStatus = HttpStatus.resolve(statusCode);
        return httpStatus != null ? httpStatus.getReasonPhrase() : String.valueOf(statusCode);
    }

    private String extractHeader(ClientHttpResponse response, String headerName) {
        return response.getHeaders().getFirst(headerName);
    }

    private Long extractContentLength(ClientHttpResponse response) {
        long contentLength = response.getHeaders().getContentLength();
        return contentLength >= 0 ? contentLength : null;
    }

    private XRoadErrorDTO parseXRoadError(ClientHttpResponse response) {
        String errorHeader = extractHeader(response, "X-Road-Error");
        if (errorHeader == null) {
            return null;
        }

        try {
            return objectMapper.readValue(errorHeader, XRoadErrorDTO.class);
        } catch (JsonProcessingException e) {
            // Fallback: treat as plain text message
            return new XRoadErrorDTO("Unknown", errorHeader, null, null, null);
        }
    }
}
