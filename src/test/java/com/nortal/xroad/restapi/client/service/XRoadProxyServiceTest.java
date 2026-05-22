package com.nortal.xroad.restapi.client.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.RequestDetailsDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceIdDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import com.nortal.xroad.restapi.client.service.mapper.XRoadRequestMapper;
import com.nortal.xroad.restapi.client.service.mapper.XRoadResponseMapper;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClient.RequestHeadersSpec.ConvertibleClientHttpResponse;

@ExtendWith(MockitoExtension.class)
class XRoadProxyServiceTest {

    @Mock
    private RestClientFactory restClientFactory;

    private XRoadRequestMapper requestMapper;
    private XRoadResponseMapper responseMapper;
    private XRoadProxyService service;

    @BeforeEach
    void setUp() {
        requestMapper = new XRoadRequestMapper();
        responseMapper = new XRoadResponseMapper();
        service = new XRoadProxyService(restClientFactory, requestMapper, responseMapper);
    }

    @Test
    void executeRequestReturnsResponse() throws IOException {
        XRoadRequestDTO request = createRequest();
        String responseBody = "{\"data\": \"test\"}";

        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.add("X-Road-Id", "xroad-id-123");
        responseHeaders.add("X-Road-Request-Hash", "request-hash-abc");
        responseHeaders.add("X-Road-Request-Id", "request-id-456");

        ConvertibleClientHttpResponse mockResponse = createMockResponse(200, responseBody, responseHeaders);

        RestClient mockRestClient = mock(RestClient.class);
        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);

        when(restClientFactory.create(any(ClientDto.class))).thenReturn(mockRestClient);
        when(mockRestClient.method(any(HttpMethod.class))).thenReturn(uriSpec);
        when(uriSpec.uri(any(String.class))).thenReturn(bodySpec);
        when(bodySpec.headers(any())).thenReturn(bodySpec);
        when(bodySpec.body(any(String.class))).thenReturn(bodySpec);
        when(bodySpec.exchange(any())).thenAnswer(invocation -> {
            RestClient.RequestHeadersSpec.ExchangeFunction<XRoadResponseDTO> function = invocation.getArgument(0);
            return function.exchange(null, mockResponse);
        });

        XRoadResponseDTO result = service.executeRequest(request);

        assertThat(result.statusCode()).isEqualTo(200);
        assertThat(result.body()).isEqualTo(responseBody);
        assertThat(result.xroadId()).isEqualTo("xroad-id-123");
        assertThat(result.xroadRequestHash()).isEqualTo("request-hash-abc");
    }

    @Test
    void executeRequestWithPostMethod() throws IOException {
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ClientSubsystem");
        ClientDto client = new ClientDto(clientSubsystem, "http://localhost:5080", null);
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "789012", "ServiceSubsystem");
        ServiceIdDto serviceId = new ServiceIdDto(serviceSubsystem, "createUser", null);
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.POST,
            "/api/users",
            null,
            null,
            "{\"name\": \"John\"}",
            "application/json"
        );
        XRoadRequestDTO request = new XRoadRequestDTO(client, serviceId, details);

        String responseBody = "{\"id\": 1}";
        ConvertibleClientHttpResponse mockResponse = createMockResponse(200, responseBody, new HttpHeaders());

        RestClient mockRestClient = mock(RestClient.class);
        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);

        when(restClientFactory.create(any(ClientDto.class))).thenReturn(mockRestClient);
        when(mockRestClient.method(any(HttpMethod.class))).thenReturn(uriSpec);
        when(uriSpec.uri(any(String.class))).thenReturn(bodySpec);
        when(bodySpec.headers(any())).thenReturn(bodySpec);
        when(bodySpec.body(any(String.class))).thenReturn(bodySpec);
        when(bodySpec.exchange(any())).thenAnswer(invocation -> {
            RestClient.RequestHeadersSpec.ExchangeFunction<XRoadResponseDTO> function = invocation.getArgument(0);
            return function.exchange(null, mockResponse);
        });

        XRoadResponseDTO result = service.executeRequest(request);

        assertThat(result.statusCode()).isEqualTo(200);
        assertThat(result.body()).isEqualTo("{\"id\": 1}");
    }

    @Test
    void executeRequestWithServiceVersion() throws IOException {
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ClientSubsystem");
        ClientDto client = new ClientDto(clientSubsystem, "http://localhost:5080", null);
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "789012", "ServiceSubsystem");
        ServiceIdDto serviceId = new ServiceIdDto(serviceSubsystem, "testService", "v1");
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.GET,
            "/api/test",
            null,
            null,
            null,
            null
        );
        XRoadRequestDTO request = new XRoadRequestDTO(client, serviceId, details);

        ConvertibleClientHttpResponse mockResponse = createMockResponse(200, "{}", new HttpHeaders());

        RestClient mockRestClient = mock(RestClient.class);
        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);

        when(restClientFactory.create(any(ClientDto.class))).thenReturn(mockRestClient);
        when(mockRestClient.method(any(HttpMethod.class))).thenReturn(uriSpec);
        when(uriSpec.uri(any(String.class))).thenReturn(bodySpec);
        when(bodySpec.headers(any())).thenReturn(bodySpec);
        when(bodySpec.body(any(String.class))).thenReturn(bodySpec);
        when(bodySpec.exchange(any())).thenAnswer(invocation -> {
            RestClient.RequestHeadersSpec.ExchangeFunction<XRoadResponseDTO> function = invocation.getArgument(0);
            return function.exchange(null, mockResponse);
        });

        XRoadResponseDTO result = service.executeRequest(request);

        assertThat(result.statusCode()).isEqualTo(200);
    }

    private XRoadRequestDTO createRequest() {
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ClientSubsystem");
        ClientDto client = new ClientDto(clientSubsystem, "http://localhost:5080", null);
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "789012", "ServiceSubsystem");
        ServiceIdDto serviceId = new ServiceIdDto(serviceSubsystem, "testService", null);
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.GET,
            "/api/test",
            null,
            null,
            null,
            null
        );
        return new XRoadRequestDTO(client, serviceId, details);
    }

    private ConvertibleClientHttpResponse createMockResponse(int statusCode, String body, HttpHeaders headers) throws IOException {
        ConvertibleClientHttpResponse response = mock(ConvertibleClientHttpResponse.class);
        when(response.getStatusCode()).thenReturn(HttpStatusCode.valueOf(statusCode));
        when(response.getBody()).thenReturn(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
        when(response.getHeaders()).thenReturn(headers);
        return response;
    }
}
