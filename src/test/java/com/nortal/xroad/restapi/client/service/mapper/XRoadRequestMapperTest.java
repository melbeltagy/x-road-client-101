package com.nortal.xroad.restapi.client.service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.RequestDetailsDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceIdDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import java.net.http.HttpRequest;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

class XRoadRequestMapperTest {

    private XRoadRequestMapper mapper;
    private ApplicationProperties properties;

    @BeforeEach
    void setUp() {
        properties = new ApplicationProperties();
        properties.getXroad().getTimeout().setReadMs(30000);
        properties.getXroad().getTimeout().setConnectMs(10000);
        mapper = new XRoadRequestMapper(properties);
    }

    @Test
    void toHttpRequestBuildsCorrectUrl() {
        XRoadRequestDTO request = createRequest(HttpMethod.GET, "/api/users", null);

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.uri().toString())
            .isEqualTo("http://localhost:8080/r1/TEST/GOV/123456/TestSubsystem/testService/api/users");
    }

    @Test
    void toHttpRequestIncludesServiceVersion() {
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "TestSubsystem");
        ServiceIdDto service = new ServiceIdDto(serviceSubsystem, "testService", "v1");
        XRoadRequestDTO request = new XRoadRequestDTO(
            createClient(),
            service,
            new RequestDetailsDto(HttpMethod.GET, "/api/users", null, null, null, null)
        );

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.uri().toString())
            .contains("/testService/v1/api/users");
    }

    @Test
    void toHttpRequestIncludesQueryParams() {
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.GET,
            "/api/users",
            Map.of("page", "1", "size", "10"),
            null,
            null,
            null
        );
        XRoadRequestDTO request = new XRoadRequestDTO(createClient(), createService(), details);

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.uri().getQuery()).contains("page=1");
        assertThat(httpRequest.uri().getQuery()).contains("size=10");
    }

    @Test
    void toHttpRequestSetsXRoadClientHeader() {
        XRoadRequestDTO request = createRequest(HttpMethod.GET, "/api/test", null);

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.headers().firstValue("X-Road-Client"))
            .hasValue("TEST/GOV/123456/ClientSubsystem");
    }

    @Test
    void toHttpRequestSetsXRoadRequestIdHeader() {
        XRoadRequestDTO request = createRequest(HttpMethod.GET, "/api/test", null);

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.headers().firstValue("X-Road-Request-Id"))
            .isPresent()
            .get()
            .asString()
            .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
    }

    @Test
    void toHttpRequestSetsContentTypeHeader() {
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.POST,
            "/api/users",
            null,
            null,
            "{\"name\": \"test\"}",
            "application/json"
        );
        XRoadRequestDTO request = new XRoadRequestDTO(createClient(), createService(), details);

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.headers().firstValue("Content-Type"))
            .hasValue("application/json");
    }

    @Test
    void toHttpRequestAddsCustomHeaders() {
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.GET,
            "/api/users",
            null,
            Map.of("X-Custom-Header", "custom-value", "Authorization", "Bearer token"),
            null,
            null
        );
        XRoadRequestDTO request = new XRoadRequestDTO(createClient(), createService(), details);

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.headers().firstValue("X-Custom-Header"))
            .hasValue("custom-value");
        assertThat(httpRequest.headers().firstValue("Authorization"))
            .hasValue("Bearer token");
    }

    @Test
    void toHttpRequestSetsHttpMethod() {
        XRoadRequestDTO postRequest = createRequest(HttpMethod.POST, "/api/users", "{\"name\": \"test\"}");
        XRoadRequestDTO deleteRequest = createRequest(HttpMethod.DELETE, "/api/users/1", null);

        HttpRequest postHttpRequest = mapper.toHttpRequest(postRequest);
        HttpRequest deleteHttpRequest = mapper.toHttpRequest(deleteRequest);

        assertThat(postHttpRequest.method()).isEqualTo("POST");
        assertThat(deleteHttpRequest.method()).isEqualTo("DELETE");
    }

    @Test
    void toHttpRequestSetsTimeout() {
        XRoadRequestDTO request = createRequest(HttpMethod.GET, "/api/test", null);

        HttpRequest httpRequest = mapper.toHttpRequest(request);

        assertThat(httpRequest.timeout())
            .isPresent()
            .hasValueSatisfying(timeout -> assertThat(timeout.toMillis()).isEqualTo(30000));
    }

    private XRoadRequestDTO createRequest(HttpMethod method, String path, String body) {
        return new XRoadRequestDTO(
            createClient(),
            createService(),
            new RequestDetailsDto(method, path, null, null, body, body != null ? "application/json" : null)
        );
    }

    private ClientDto createClient() {
        SubsystemIdDto clientSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "ClientSubsystem");
        return new ClientDto(clientSubsystem, "http://localhost:8080", null);
    }

    private ServiceIdDto createService() {
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "TestSubsystem");
        return new ServiceIdDto(serviceSubsystem, "testService", null);
    }
}
