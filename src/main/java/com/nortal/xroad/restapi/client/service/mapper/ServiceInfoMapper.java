package com.nortal.xroad.restapi.client.service.mapper;

import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto.ServiceEntry;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ServiceInfoMapper {

    public List<ServiceInfoDto> toList(ServiceListResponseDto response) {
        if (response == null || response.service() == null) {
            return List.of();
        }

        return response.service().stream()
            .filter(this::isValidService)
            .map(this::toDto)
            .toList();
    }

    private boolean isValidService(ServiceEntry service) {
        return service.serviceCode() != null && !service.serviceCode().isEmpty();
    }

    private ServiceInfoDto toDto(ServiceEntry service) {
        List<ServiceInfoDto.EndpointDto> endpoints = service.endpointList() != null
            ? service.endpointList().stream()
                .map(ep -> new ServiceInfoDto.EndpointDto(ep.method(), ep.path()))
                .toList()
            : List.of();

        return new ServiceInfoDto(
            service.serviceCode(),
            service.serviceType(),
            endpoints
        );
    }
}
