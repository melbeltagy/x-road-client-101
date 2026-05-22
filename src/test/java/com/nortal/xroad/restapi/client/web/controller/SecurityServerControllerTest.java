package com.nortal.xroad.restapi.client.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nortal.xroad.restapi.client.service.SecurityServerService;
import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.ServicesRequestDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class SecurityServerControllerTest {

    @Mock
    private SecurityServerService securityServerService;

    private SecurityServerController controller;

    @BeforeEach
    void setUp() {
        controller = new SecurityServerController(securityServerService);
    }

    @Test
    void getRegisteredClientsReturnsClients() {
        List<SubsystemIdDto> clients = List.of(
            new SubsystemIdDto("TEST", "GOV", "123456", "SubsystemA"),
            new SubsystemIdDto("TEST", "COM", "789012", "SubsystemB")
        );

        when(securityServerService.getRegisteredClients("http://localhost:5080")).thenReturn(clients);

        ResponseEntity<List<SubsystemIdDto>> result = controller.getRegisteredClients("http://localhost:5080");

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody()).hasSize(2);
        assertThat(result.getBody().get(0).instanceId()).isEqualTo("TEST");
        assertThat(result.getBody().get(0).memberClass()).isEqualTo("GOV");
        assertThat(result.getBody().get(1).subsystemCode()).isEqualTo("SubsystemB");
        verify(securityServerService).getRegisteredClients("http://localhost:5080");
    }

    @Test
    void getRegisteredClientsReturnsEmptyList() {
        when(securityServerService.getRegisteredClients("http://localhost:5080")).thenReturn(List.of());

        ResponseEntity<List<SubsystemIdDto>> result = controller.getRegisteredClients("http://localhost:5080");

        assertThat(result.getBody()).isEmpty();
    }

    @Test
    void getServicesReturnsServices() {
        List<ServiceInfoDto> services = List.of(
            new ServiceInfoDto("getUsers", "REST", List.of(
                new ServiceInfoDto.EndpointDto("GET", "/api/users"),
                new ServiceInfoDto.EndpointDto("POST", "/api/users")
            )),
            new ServiceInfoDto("getOrders", "REST", List.of())
        );

        when(securityServerService.getServices(
            eq("http://localhost:5080"),
            any(SubsystemIdDto.class),
            any(SubsystemIdDto.class)
        )).thenReturn(services);

        ServicesRequestDto request = new ServicesRequestDto(
            "http://localhost:5080",
            new SubsystemIdDto("TEST", "GOV", "123456", "ClientSub"),
            new SubsystemIdDto("TEST", "GOV", "789012", "ServiceSub")
        );

        ResponseEntity<List<ServiceInfoDto>> result = controller.getServices(request);

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody()).hasSize(2);
        assertThat(result.getBody().get(0).serviceCode()).isEqualTo("getUsers");
        assertThat(result.getBody().get(0).endpoints()).hasSize(2);
        assertThat(result.getBody().get(1).serviceCode()).isEqualTo("getOrders");
    }

    @Test
    void getServicesPassesCorrectSubsystems() {
        when(securityServerService.getServices(
            any(String.class),
            any(SubsystemIdDto.class),
            any(SubsystemIdDto.class)
        )).thenReturn(List.of());

        ServicesRequestDto request = new ServicesRequestDto(
            "http://localhost:5080",
            new SubsystemIdDto("INST1", "CLASS1", "CODE1", "SUB1"),
            new SubsystemIdDto("INST2", "CLASS2", "CODE2", "SUB2")
        );

        controller.getServices(request);

        verify(securityServerService).getServices(
            eq("http://localhost:5080"),
            eq(new SubsystemIdDto("INST1", "CLASS1", "CODE1", "SUB1")),
            eq(new SubsystemIdDto("INST2", "CLASS2", "CODE2", "SUB2"))
        );
    }
}
