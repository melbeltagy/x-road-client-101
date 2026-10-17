package io.github.melbeltagy.xroad.restapi.client.service.dto;

public record XRoadErrorDTO(String type, String message, String detail, String faultCode, String faultString) {}
