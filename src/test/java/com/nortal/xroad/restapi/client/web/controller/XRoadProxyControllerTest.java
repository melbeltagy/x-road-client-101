package com.nortal.xroad.restapi.client.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nortal.xroad.restapi.client.service.XRoadProxyService;
import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.RequestDetailsDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceIdDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class XRoadProxyControllerTest {

    @Mock
    private XRoadProxyService xroadProxyService;

    private XRoadProxyController controller;

    @BeforeEach
    void setUp() {
        controller = new XRoadProxyController(xroadProxyService);
    }

    @Test
    void executeXRoadRequestReturnsResponse() {
        XRoadRequestDTO request = createRequest();
        XRoadResponseDTO response = createResponse();

        when(xroadProxyService.executeRequest(any(XRoadRequestDTO.class))).thenReturn(response);

        ResponseEntity<XRoadResponseDTO> result = controller.executeXRoadRequest(request);

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().statusCode()).isEqualTo(200);
        assertThat(result.getBody().body()).isEqualTo("{\"data\": \"test\"}");
        assertThat(result.getBody().xroadId()).isEqualTo("xroad-id-123");
        verify(xroadProxyService).executeRequest(any(XRoadRequestDTO.class));
    }

    @Test
    void executeXRoadRequestCallsService() {
        XRoadRequestDTO request = createRequest();
        XRoadResponseDTO response = createResponse();

        when(xroadProxyService.executeRequest(request)).thenReturn(response);

        controller.executeXRoadRequest(request);

        verify(xroadProxyService).executeRequest(request);
    }

    private XRoadRequestDTO createRequest() {
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ClientSubsystem");
        ClientDto client = new ClientDto(clientSubsystem, "http://localhost:5080", null);
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "789012", "ServiceSubsystem");
        ServiceIdDto serviceId = new ServiceIdDto(serviceSubsystem, "testService", null);
        RequestDetailsDto details = new RequestDetailsDto(HttpMethod.GET, "/api/test", null, null, null, null);
        return new XRoadRequestDTO(client, serviceId, details);
    }

    private XRoadResponseDTO createResponse() {
        return new XRoadResponseDTO(
            200,
            "OK",
            Map.of("Content-Type", List.of("application/json")),
            "{\"data\": \"test\"}",
            "application/json",
            100L,
            "xroad-id-123",
            "request-hash-abc",
            "request-id-456",
            null,
            Instant.now()
        );
    }
}
