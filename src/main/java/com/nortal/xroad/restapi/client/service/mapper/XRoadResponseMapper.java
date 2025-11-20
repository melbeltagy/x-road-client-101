package com.nortal.xroad.restapi.client.service.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nortal.xroad.restapi.client.service.dto.XRoadErrorDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;

@Mapper(componentModel = "spring")
public interface XRoadResponseMapper {
    @Mapping(target = "statusCode", expression = "java(response.statusCode().value())")
    @Mapping(target = "statusText", expression = "java(getStatusText(response))")
    @Mapping(target = "headers", expression = "java(mapHeaders(response))")
    @Mapping(target = "body", source = "body")
    @Mapping(target = "contentType", expression = "java(mapContentType(response))")
    @Mapping(target = "contentLength", expression = "java(mapContentLength(response))")
    @Mapping(target = "xroadId", expression = "java(extractHeader(response, \"X-Road-Id\"))")
    @Mapping(target = "xroadRequestHash", expression = "java(extractHeader(response, \"X-Road-Request-Hash\"))")
    @Mapping(target = "xroadRequestId", expression = "java(extractHeader(response, \"X-Road-Request-Id\"))")
    @Mapping(target = "xroadError", expression = "java(parseXRoadError(response))")
    @Mapping(target = "timestamp", expression = "java(java.time.Instant.now())")
    XRoadResponseDTO toDto(ClientResponse response, String body);

    default Map<String, List<String>> mapHeaders(ClientResponse response) {
        return response
            .headers()
            .asHttpHeaders()
            .toSingleValueMap()
            .entrySet()
            .stream()
            .collect(Collectors.toMap(Map.Entry::getKey, e -> List.of(e.getValue())));
    }

    default String getStatusText(ClientResponse response) {
        org.springframework.http.HttpStatus httpStatus = org.springframework.http.HttpStatus.resolve(response.statusCode().value());
        return httpStatus != null ? httpStatus.getReasonPhrase() : String.valueOf(response.statusCode().value());
    }

    default String mapContentType(ClientResponse response) {
        return response.headers().contentType().map(MediaType::toString).orElse(null);
    }

    default Long mapContentLength(ClientResponse response) {
        return response.headers().contentLength().isPresent() ? response.headers().contentLength().getAsLong() : null;
    }

    default String extractHeader(ClientResponse response, String headerName) {
        return response.headers().header(headerName).stream().findFirst().orElse(null);
    }

    default XRoadErrorDTO parseXRoadError(ClientResponse response) {
        String errorHeader = extractHeader(response, "X-Road-Error");
        if (errorHeader == null) {
            return null;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(errorHeader, XRoadErrorDTO.class);
        } catch (JsonProcessingException e) {
            // Fallback: treat as plain text message
            return new XRoadErrorDTO("Unknown", errorHeader, null, null, null);
        }
    }
}
