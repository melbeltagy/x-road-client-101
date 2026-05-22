package com.nortal.xroad.restapi.client.service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto.EndpointEntry;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto.ServiceEntry;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ServiceInfoMapperTest {

    private ServiceInfoMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ServiceInfoMapper();
    }

    @Test
    void mapsValidServices() {
        ServiceListResponseDto response = new ServiceListResponseDto(
            List.of(
                new ServiceEntry("getUsers", "REST", List.of(
                    new EndpointEntry("GET", "/api/users"),
                    new EndpointEntry("POST", "/api/users")
                )),
                new ServiceEntry("getOrders", "REST", List.of(
                    new EndpointEntry("GET", "/api/orders")
                ))
            )
        );

        List<ServiceInfoDto> result = mapper.toList(response);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).serviceCode()).isEqualTo("getUsers");
        assertThat(result.get(0).serviceType()).isEqualTo("REST");
        assertThat(result.get(0).endpoints()).hasSize(2);
        assertThat(result.get(0).endpoints().get(0).method()).isEqualTo("GET");
        assertThat(result.get(0).endpoints().get(0).path()).isEqualTo("/api/users");
        assertThat(result.get(1).serviceCode()).isEqualTo("getOrders");
    }

    @Test
    void handlesNullEndpointList() {
        ServiceListResponseDto response = new ServiceListResponseDto(
            List.of(new ServiceEntry("simpleService", "SOAP", null))
        );

        List<ServiceInfoDto> result = mapper.toList(response);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().serviceCode()).isEqualTo("simpleService");
        assertThat(result.getFirst().endpoints()).isEmpty();
    }

    @Test
    void filtersServicesWithEmptyServiceCode() {
        ServiceListResponseDto response = new ServiceListResponseDto(
            List.of(
                new ServiceEntry("validService", "REST", List.of()),
                new ServiceEntry("", "REST", List.of()),
                new ServiceEntry(null, "REST", List.of())
            )
        );

        List<ServiceInfoDto> result = mapper.toList(response);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().serviceCode()).isEqualTo("validService");
    }

    @Test
    void returnsEmptyListForNullResponse() {
        List<ServiceInfoDto> result = mapper.toList(null);

        assertThat(result).isEmpty();
    }

    @Test
    void returnsEmptyListForNullServiceList() {
        ServiceListResponseDto response = new ServiceListResponseDto(null);

        List<ServiceInfoDto> result = mapper.toList(response);

        assertThat(result).isEmpty();
    }

    @Test
    void returnsEmptyListForEmptyServiceList() {
        ServiceListResponseDto response = new ServiceListResponseDto(List.of());

        List<ServiceInfoDto> result = mapper.toList(response);

        assertThat(result).isEmpty();
    }
}
