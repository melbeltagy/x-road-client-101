package com.nortal.xroad.restapi.client.service.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.ClientHttpResponse;

class XRoadResponseMapperTest {

    private XRoadResponseMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new XRoadResponseMapper();
    }

    @Test
    void toDtoMapsStatusCode() throws IOException {
        ClientHttpResponse response = createMockResponse(200, "{}", new HttpHeaders());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.statusCode()).isEqualTo(200);
        assertThat(dto.statusText()).isEqualTo("OK");
    }

    @Test
    void toDtoMapsBody() throws IOException {
        String body = "{\"result\": \"success\"}";
        ClientHttpResponse response = createMockResponse(200, body, new HttpHeaders());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.body()).isEqualTo(body);
    }

    @Test
    void toDtoMapsHeaders() throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("X-Custom-Header", "value1");
        ClientHttpResponse response = createMockResponse(200, "{}", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.headers()).containsKey("Content-Type");
        assertThat(dto.headers().get("Content-Type")).contains("application/json");
    }

    @Test
    void toDtoExtractsContentType() throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json; charset=utf-8");
        ClientHttpResponse response = createMockResponse(200, "{}", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.contentType()).isEqualTo("application/json; charset=utf-8");
    }

    @Test
    void toDtoExtractsContentLength() throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentLength(1234L);
        ClientHttpResponse response = createMockResponse(200, "{}", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.contentLength()).isEqualTo(1234L);
    }

    @Test
    void toDtoExtractsXRoadHeaders() throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Road-Id", "abc123");
        headers.add("X-Road-Request-Hash", "hash456");
        headers.add("X-Road-Request-Id", "req789");
        ClientHttpResponse response = createMockResponse(200, "{}", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.xroadId()).isEqualTo("abc123");
        assertThat(dto.xroadRequestHash()).isEqualTo("hash456");
        assertThat(dto.xroadRequestId()).isEqualTo("req789");
    }

    @Test
    void toDtoParsesXRoadErrorHeader() throws IOException {
        String errorJson = "{\"type\":\"Server.ServerProxy.ServiceFailed\",\"message\":\"Service failed\",\"detail\":\"Connection refused\"}";
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Road-Error", errorJson);
        ClientHttpResponse response = createMockResponse(500, "", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.xroadError()).isNotNull();
        assertThat(dto.xroadError().type()).isEqualTo("Server.ServerProxy.ServiceFailed");
        assertThat(dto.xroadError().message()).isEqualTo("Service failed");
        assertThat(dto.xroadError().detail()).isEqualTo("Connection refused");
    }

    @Test
    void toDtoHandlesInvalidXRoadErrorHeader() throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Road-Error", "Not valid JSON");
        ClientHttpResponse response = createMockResponse(500, "", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.xroadError()).isNotNull();
        assertThat(dto.xroadError().type()).isEqualTo("Unknown");
        assertThat(dto.xroadError().message()).isEqualTo("Not valid JSON");
    }

    @Test
    void toDtoSetsTimestamp() throws IOException {
        ClientHttpResponse response = createMockResponse(200, "{}", new HttpHeaders());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.timestamp()).isNotNull();
    }

    @Test
    void toDtoHandlesUnknownStatusCode() throws IOException {
        ClientHttpResponse response = createMockResponse(599, "{}", new HttpHeaders());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.statusCode()).isEqualTo(599);
        assertThat(dto.statusText()).isEqualTo("599");
    }

    private ClientHttpResponse createMockResponse(int statusCode, String body, HttpHeaders headers) throws IOException {
        ClientHttpResponse response = mock(ClientHttpResponse.class);

        when(response.getStatusCode()).thenReturn(HttpStatusCode.valueOf(statusCode));
        when(response.getBody()).thenReturn(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
        when(response.getHeaders()).thenReturn(headers);

        return response;
    }
}
