package com.nortal.xroad.restapi.client.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto.MemberEntry;
import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto.MemberId;
import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto.EndpointEntry;
import com.nortal.xroad.restapi.client.service.dto.ServiceListResponseDto.ServiceEntry;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.mapper.ServiceInfoMapper;
import com.nortal.xroad.restapi.client.service.mapper.SubsystemIdMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class SecurityServerServiceTest {

    @Mock
    private RestClient.Builder restClientBuilder;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private SubsystemIdMapper subsystemIdMapper;
    private ServiceInfoMapper serviceInfoMapper;
    private SecurityServerService service;

    @BeforeEach
    void setUp() {
        subsystemIdMapper = new SubsystemIdMapper();
        serviceInfoMapper = new ServiceInfoMapper();
        service = new SecurityServerService(restClientBuilder, subsystemIdMapper, serviceInfoMapper);
        when(restClientBuilder.build()).thenReturn(restClient);
    }

    @Test
    void getRegisteredClientsReturnsClients() {
        ClientListResponseDto response = new ClientListResponseDto(
            List.of(
                new MemberEntry(new MemberId("SUBSYSTEM", "TEST", "GOV", "123456", "TestSubsystem")),
                new MemberEntry(new MemberId("MEMBER", "TEST", "GOV", "789012", null))
            )
        );

        setupGetMocks();
        when(responseSpec.body(ClientListResponseDto.class)).thenReturn(response);

        List<SubsystemIdDto> clients = service.getRegisteredClients("http://localhost:5080");

        assertThat(clients).hasSize(1);
        assertThat(clients.getFirst().instanceId()).isEqualTo("TEST");
        assertThat(clients.getFirst().memberClass()).isEqualTo("GOV");
        assertThat(clients.getFirst().memberCode()).isEqualTo("123456");
        assertThat(clients.getFirst().subsystemCode()).isEqualTo("TestSubsystem");
    }

    @Test
    void getRegisteredClientsThrowsExceptionOnServerError() {
        setupGetMocks();
        when(responseSpec.body(ClientListResponseDto.class))
            .thenThrow(HttpServerErrorException.InternalServerError.class);

        assertThatThrownBy(() -> service.getRegisteredClients("http://localhost:5080"))
            .isInstanceOf(HttpServerErrorException.class);
    }

    @Test
    void getRegisteredClientsHandlesTrailingSlash() {
        ClientListResponseDto response = new ClientListResponseDto(List.of());

        setupGetMocks();
        when(responseSpec.body(ClientListResponseDto.class)).thenReturn(response);

        List<SubsystemIdDto> clients = service.getRegisteredClients("http://localhost:5080/");

        assertThat(clients).isEmpty();
    }

    @Test
    void getServicesReturnsServices() {
        ServiceListResponseDto response = new ServiceListResponseDto(
            List.of(
                new ServiceEntry(
                    "getUsers",
                    "REST",
                    List.of(
                        new EndpointEntry("GET", "/api/users"),
                        new EndpointEntry("POST", "/api/users")
                    )
                ),
                new ServiceEntry(
                    "getOrders",
                    "REST",
                    List.of(new EndpointEntry("GET", "/api/orders"))
                )
            )
        );

        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ServiceSubsystem");
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "789012", "ClientSubsystem");

        setupGetMocksWithHeader();
        when(responseSpec.body(ServiceListResponseDto.class)).thenReturn(response);

        List<ServiceInfoDto> services = service.getServices("http://localhost:5080", clientSubsystem, serviceSubsystem);

        assertThat(services).hasSize(2);
        assertThat(services.getFirst().serviceCode()).isEqualTo("getUsers");
        assertThat(services.getFirst().endpoints()).hasSize(2);
        assertThat(services.get(1).serviceCode()).isEqualTo("getOrders");
    }

    @Test
    void getServicesHandlesEmptyEndpointList() {
        ServiceListResponseDto response = new ServiceListResponseDto(
            List.of(new ServiceEntry("simpleService", "SOAP", null))
        );

        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ServiceSubsystem");
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "789012", "ClientSubsystem");

        setupGetMocksWithHeader();
        when(responseSpec.body(ServiceListResponseDto.class)).thenReturn(response);

        List<ServiceInfoDto> services = service.getServices("http://localhost:5080", clientSubsystem, serviceSubsystem);

        assertThat(services).hasSize(1);
        assertThat(services.getFirst().endpoints()).isEmpty();
    }

    @Test
    void getServicesReturnsEmptyListOnEmptyResponse() {
        ServiceListResponseDto response = new ServiceListResponseDto(List.of());

        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ServiceSubsystem");
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "789012", "ClientSubsystem");

        setupGetMocksWithHeader();
        when(responseSpec.body(ServiceListResponseDto.class)).thenReturn(response);

        List<ServiceInfoDto> services = service.getServices("http://localhost:5080", clientSubsystem, serviceSubsystem);

        assertThat(services).isEmpty();
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void setupGetMocks() {
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        doReturn(uriSpec).when(restClient).get();
        doReturn(requestHeadersSpec).when(uriSpec).uri(anyString());
        doReturn(requestHeadersSpec).when(requestHeadersSpec).accept(any(MediaType.class));
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void setupGetMocksWithHeader() {
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        doReturn(uriSpec).when(restClient).get();
        doReturn(requestHeadersSpec).when(uriSpec).uri(anyString());
        doReturn(requestHeadersSpec).when(requestHeadersSpec).accept(any(MediaType.class));
        doReturn(requestHeadersSpec).when(requestHeadersSpec).header(anyString(), anyString());
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
    }
}
