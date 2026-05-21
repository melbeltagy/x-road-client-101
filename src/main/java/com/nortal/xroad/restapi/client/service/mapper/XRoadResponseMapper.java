package com.nortal.xroad.restapi.client.service.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nortal.xroad.restapi.client.service.dto.XRoadErrorDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class XRoadResponseMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public XRoadResponseDTO toDto(HttpResponse<String> response) {
        return new XRoadResponseDTO(
            response.statusCode(),
            getStatusText(response.statusCode()),
            mapHeaders(response),
            response.body(),
            extractHeader(response, "Content-Type"),
            extractContentLength(response),
            extractHeader(response, "X-Road-Id"),
            extractHeader(response, "X-Road-Request-Hash"),
            extractHeader(response, "X-Road-Request-Id"),
            parseXRoadError(response),
            Instant.now()
        );
    }

    private Map<String, List<String>> mapHeaders(HttpResponse<String> response) {
        return response.headers().map().entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private String getStatusText(int statusCode) {
        HttpStatus httpStatus = HttpStatus.resolve(statusCode);
        return httpStatus != null ? httpStatus.getReasonPhrase() : String.valueOf(statusCode);
    }

    private String extractHeader(HttpResponse<String> response, String headerName) {
        return response.headers().firstValue(headerName).orElse(null);
    }

    private Long extractContentLength(HttpResponse<String> response) {
        return response.headers().firstValueAsLong("Content-Length").stream().boxed().findFirst().orElse(null);
    }

    private XRoadErrorDTO parseXRoadError(HttpResponse<String> response) {
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
