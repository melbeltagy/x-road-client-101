package com.nortal.xroad.restapi.client.service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.RequestDetailsDto;
import com.nortal.xroad.restapi.client.service.dto.ServiceIdDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

class XRoadRequestMapperTest {

    private XRoadRequestMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new XRoadRequestMapper();
    }

    @Test
    void buildUrlBuildsCorrectUrl() {
        XRoadRequestDTO request = createRequest(HttpMethod.GET, "/api/users", null);

        String url = mapper.buildUrl(request);

        assertThat(url).isEqualTo("http://localhost:8080/r1/TEST/GOV/123456/TestSubsystem/testService/api/users");
    }

    @Test
    void buildUrlIncludesServiceVersion() {
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto("TEST", "GOV", "123456", "TestSubsystem");
        ServiceIdDto service = new ServiceIdDto(serviceSubsystem, "testService", "v1");
        XRoadRequestDTO request = new XRoadRequestDTO(
            createClient(),
            service,
            new RequestDetailsDto(HttpMethod.GET, "/api/users", null, null, null, null)
        );

        String url = mapper.buildUrl(request);

        assertThat(url).contains("/testService/v1/api/users");
    }

    @Test
    void buildUrlIncludesQueryParams() {
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.GET,
            "/api/users",
            Map.of("page", "1", "size", "10"),
            null,
            null,
            null
        );
        XRoadRequestDTO request = new XRoadRequestDTO(createClient(), createService(), details);

        String url = mapper.buildUrl(request);

        assertThat(url).contains("page=1");
        assertThat(url).contains("size=10");
    }

    @Test
    void addHeadersSetsXRoadClientHeader() {
        XRoadRequestDTO request = createRequest(HttpMethod.GET, "/api/test", null);
        HttpHeaders headers = new HttpHeaders();

        mapper.addHeaders(headers, request);

        assertThat(headers.getFirst("X-Road-Client")).isEqualTo("TEST/GOV/123456/ClientSubsystem");
    }

    @Test
    void addHeadersSetsXRoadRequestIdHeader() {
        XRoadRequestDTO request = createRequest(HttpMethod.GET, "/api/test", null);
        HttpHeaders headers = new HttpHeaders();

        mapper.addHeaders(headers, request);

        assertThat(headers.getFirst("X-Road-Request-Id"))
            .isNotNull()
            .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
    }

    @Test
    void addHeadersSetsContentTypeHeader() {
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.POST,
            "/api/users",
            null,
            null,
            "{\"name\": \"test\"}",
            "application/json"
        );
        XRoadRequestDTO request = new XRoadRequestDTO(createClient(), createService(), details);
        HttpHeaders headers = new HttpHeaders();

        mapper.addHeaders(headers, request);

        assertThat(headers.getFirst("Content-Type")).isEqualTo("application/json");
    }

    @Test
    void addHeadersAddsCustomHeaders() {
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.GET,
            "/api/users",
            null,
            Map.of("X-Custom-Header", "custom-value", "Authorization", "Bearer token"),
            null,
            null
        );
        XRoadRequestDTO request = new XRoadRequestDTO(createClient(), createService(), details);
        HttpHeaders headers = new HttpHeaders();

        mapper.addHeaders(headers, request);

        assertThat(headers.getFirst("X-Custom-Header")).isEqualTo("custom-value");
        assertThat(headers.getFirst("Authorization")).isEqualTo("Bearer token");
    }

    @Test
    void addHeadersDoesNotDuplicateContentType() {
        RequestDetailsDto details = new RequestDetailsDto(
            HttpMethod.POST,
            "/api/users",
            null,
            Map.of("Content-Type", "text/plain"),
            "{\"name\": \"test\"}",
            "application/json"
        );
        XRoadRequestDTO request = new XRoadRequestDTO(createClient(), createService(), details);
        HttpHeaders headers = new HttpHeaders();

        mapper.addHeaders(headers, request);

        // contentType parameter takes precedence
        assertThat(headers.getFirst("Content-Type")).isEqualTo("application/json");
        assertThat(headers.get("Content-Type")).hasSize(1);
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
