package com.nortal.xroad.restapi.client.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityServerService {

    private final ApplicationProperties applicationProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<SubsystemIdDto> getRegisteredClients(String securityServerUrl) throws IOException, InterruptedException {
        log.debug("Fetching registered clients from security server: {}", securityServerUrl);

        String listClientsUrl = buildListClientsUrl(securityServerUrl);

        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(applicationProperties.getXroad().getTimeout().getConnectMs()))
            .build();

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(listClientsUrl))
            .timeout(Duration.ofMillis(applicationProperties.getXroad().getTimeout().getReadMs()))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Failed to fetch clients from security server. Status: {}", response.statusCode());
            return List.of();
        }

        return parseClientList(response.body());
    }

    public List<ServiceInfoDto> getServices(
        String securityServerUrl,
        SubsystemIdDto clientSubsystem,
        SubsystemIdDto serviceSubsystem
    ) throws IOException, InterruptedException {
        log.debug("Fetching services for subsystem: {}/{}/{}/{}",
            serviceSubsystem.instanceId(), serviceSubsystem.memberClass(),
            serviceSubsystem.memberCode(), serviceSubsystem.subsystemCode());

        String listMethodsUrl = buildListMethodsUrl(securityServerUrl, serviceSubsystem);
        String clientHeader = formatSubsystemId(clientSubsystem);

        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(applicationProperties.getXroad().getTimeout().getConnectMs()))
            .build();

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(listMethodsUrl))
            .timeout(Duration.ofMillis(applicationProperties.getXroad().getTimeout().getReadMs()))
            .header("Accept", "application/json")
            .header("X-Road-Client", clientHeader)
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Failed to fetch services. Status: {}, Body: {}", response.statusCode(), response.body());
            return List.of();
        }

        return parseServiceList(response.body());
    }

    private String buildListMethodsUrl(String securityServerUrl, SubsystemIdDto subsystem) {
        String baseUrl = securityServerUrl.endsWith("/")
            ? securityServerUrl.substring(0, securityServerUrl.length() - 1)
            : securityServerUrl;
        return String.format("%s/r1/%s/%s/%s/%s/listMethods",
            baseUrl,
            subsystem.instanceId(),
            subsystem.memberClass(),
            subsystem.memberCode(),
            subsystem.subsystemCode());
    }

    private String formatSubsystemId(SubsystemIdDto subsystem) {
        return String.format("%s/%s/%s/%s",
            subsystem.instanceId(),
            subsystem.memberClass(),
            subsystem.memberCode(),
            subsystem.subsystemCode());
    }

    private List<ServiceInfoDto> parseServiceList(String responseBody) throws IOException {
        List<ServiceInfoDto> services = new ArrayList<>();
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode serviceArray = root.path("service");

        if (serviceArray.isArray()) {
            for (JsonNode service : serviceArray) {
                String serviceCode = service.path("service_code").asText();
                String serviceType = service.path("service_type").asText();

                List<ServiceInfoDto.EndpointDto> endpoints = new ArrayList<>();
                JsonNode endpointList = service.path("endpoint_list");
                if (endpointList.isArray()) {
                    for (JsonNode endpoint : endpointList) {
                        String method = endpoint.path("method").asText();
                        String path = endpoint.path("path").asText();
                        endpoints.add(new ServiceInfoDto.EndpointDto(method, path));
                    }
                }

                if (!serviceCode.isEmpty()) {
                    services.add(new ServiceInfoDto(serviceCode, serviceType, endpoints));
                }
            }
        }

        log.debug("Parsed {} services from security server", services.size());
        return services;
    }

    private String buildListClientsUrl(String securityServerUrl) {
        String baseUrl = securityServerUrl.endsWith("/")
            ? securityServerUrl.substring(0, securityServerUrl.length() - 1)
            : securityServerUrl;
        return baseUrl + "/listClients";
    }

    private List<SubsystemIdDto> parseClientList(String responseBody) throws IOException {
        List<SubsystemIdDto> clients = new ArrayList<>();
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode memberArray = root.path("member");

        if (memberArray.isArray()) {
            for (JsonNode member : memberArray) {
                JsonNode id = member.path("id");
                String objectType = id.path("object_type").asText();

                // Only include entries that are SUBSYSTEM (not plain MEMBER)
                if ("SUBSYSTEM".equals(objectType)) {
                    String instanceId = id.path("xroad_instance").asText();
                    String memberClass = id.path("member_class").asText();
                    String memberCode = id.path("member_code").asText();
                    String subsystemCode = id.path("subsystem_code").asText();

                    if (!subsystemCode.isEmpty()) {
                        clients.add(new SubsystemIdDto(instanceId, memberClass, memberCode, subsystemCode));
                    }
                }
            }
        }

        log.debug("Parsed {} registered clients from security server", clients.size());
        return clients;
    }
}
