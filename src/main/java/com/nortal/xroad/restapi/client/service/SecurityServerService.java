package com.nortal.xroad.restapi.client.service;

import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.mapper.ServiceInfoMapper;
import com.nortal.xroad.restapi.client.service.mapper.SubsystemIdMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityServerService {

    private final RestClient.Builder restClientBuilder;
    private final SubsystemIdMapper subsystemIdMapper;
    private final ServiceInfoMapper serviceInfoMapper;

    public List<SubsystemIdDto> getRegisteredClients(String securityServerUrl) {
        log.debug("Fetching registered clients from security server: {}", securityServerUrl);

        String listClientsUrl = buildListClientsUrl(securityServerUrl);

        ClientListResponseDto response = restClientBuilder.build()
            .get()
            .uri(listClientsUrl)
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .body(ClientListResponseDto.class);

        List<SubsystemIdDto> clients = subsystemIdMapper.toList(response);
        log.debug("Parsed {} registered clients from security server", clients.size());
        return clients;
    }

    public List<ServiceInfoDto> getServices(
        String securityServerUrl,
        SubsystemIdDto clientSubsystem,
        SubsystemIdDto serviceSubsystem
    ) {
        log.debug("Fetching services for subsystem: {}/{}/{}/{}",
            serviceSubsystem.instanceId(), serviceSubsystem.memberClass(),
            serviceSubsystem.memberCode(), serviceSubsystem.subsystemCode());

        String listMethodsUrl = buildListMethodsUrl(securityServerUrl, serviceSubsystem);
        String clientHeader = formatSubsystemId(clientSubsystem);

        ServiceListResponseDto response = restClientBuilder.build()
            .get()
            .uri(listMethodsUrl)
            .accept(MediaType.APPLICATION_JSON)
            .header("X-Road-Client", clientHeader)
            .retrieve()
            .body(ServiceListResponseDto.class);

        List<ServiceInfoDto> services = serviceInfoMapper.toList(response);
        log.debug("Parsed {} services from security server", services.size());
        return services;
    }

    private String buildListMethodsUrl(String securityServerUrl, SubsystemIdDto subsystem) {
        String baseUrl = normalizeUrl(securityServerUrl);
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

    private String buildListClientsUrl(String securityServerUrl) {
        return normalizeUrl(securityServerUrl) + "/listClients";
    }

    private String normalizeUrl(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
