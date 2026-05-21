package com.nortal.xroad.restapi.client.service.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import java.net.http.HttpHeaders;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.OptionalLong;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class XRoadResponseMapperTest {

    private XRoadResponseMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new XRoadResponseMapper();
    }

    @Test
    void toDtoMapsStatusCode() {
        HttpResponse<String> response = createMockResponse(200, "OK", "{}", Map.of());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.statusCode()).isEqualTo(200);
        assertThat(dto.statusText()).isEqualTo("OK");
    }

    @Test
    void toDtoMapsBody() {
        String body = "{\"result\": \"success\"}";
        HttpResponse<String> response = createMockResponse(200, "OK", body, Map.of());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.body()).isEqualTo(body);
    }

    @Test
    void toDtoMapsHeaders() {
        Map<String, List<String>> headers = Map.of(
            "Content-Type", List.of("application/json"),
            "X-Custom-Header", List.of("value1", "value2")
        );
        HttpResponse<String> response = createMockResponse(200, "OK", "{}", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.headers()).containsKey("Content-Type");
        assertThat(dto.headers().get("Content-Type")).contains("application/json");
    }

    @Test
    void toDtoExtractsContentType() {
        Map<String, List<String>> headers = Map.of("Content-Type", List.of("application/json; charset=utf-8"));
        HttpResponse<String> response = createMockResponse(200, "OK", "{}", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.contentType()).isEqualTo("application/json; charset=utf-8");
    }

    @Test
    void toDtoExtractsContentLength() {
        Map<String, List<String>> headers = Map.of("Content-Length", List.of("1234"));
        HttpResponse<String> response = createMockResponseWithContentLength(200, "{}", headers, 1234L);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.contentLength()).isEqualTo(1234L);
    }

    @Test
    void toDtoExtractsXRoadHeaders() {
        Map<String, List<String>> headers = Map.of(
            "X-Road-Id", List.of("abc123"),
            "X-Road-Request-Hash", List.of("hash456"),
            "X-Road-Request-Id", List.of("req789")
        );
        HttpResponse<String> response = createMockResponse(200, "OK", "{}", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.xroadId()).isEqualTo("abc123");
        assertThat(dto.xroadRequestHash()).isEqualTo("hash456");
        assertThat(dto.xroadRequestId()).isEqualTo("req789");
    }

    @Test
    void toDtoParsesXRoadErrorHeader() {
        String errorJson = "{\"type\":\"Server.ServerProxy.ServiceFailed\",\"message\":\"Service failed\",\"detail\":\"Connection refused\"}";
        Map<String, List<String>> headers = Map.of("X-Road-Error", List.of(errorJson));
        HttpResponse<String> response = createMockResponse(500, "Internal Server Error", "", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.xroadError()).isNotNull();
        assertThat(dto.xroadError().type()).isEqualTo("Server.ServerProxy.ServiceFailed");
        assertThat(dto.xroadError().message()).isEqualTo("Service failed");
        assertThat(dto.xroadError().detail()).isEqualTo("Connection refused");
    }

    @Test
    void toDtoHandlesInvalidXRoadErrorHeader() {
        Map<String, List<String>> headers = Map.of("X-Road-Error", List.of("Not valid JSON"));
        HttpResponse<String> response = createMockResponse(500, "Internal Server Error", "", headers);

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.xroadError()).isNotNull();
        assertThat(dto.xroadError().type()).isEqualTo("Unknown");
        assertThat(dto.xroadError().message()).isEqualTo("Not valid JSON");
    }

    @Test
    void toDtoSetsTimestamp() {
        HttpResponse<String> response = createMockResponse(200, "OK", "{}", Map.of());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.timestamp()).isNotNull();
    }

    @Test
    void toDtoHandlesUnknownStatusCode() {
        HttpResponse<String> response = createMockResponse(599, null, "{}", Map.of());

        XRoadResponseDTO dto = mapper.toDto(response);

        assertThat(dto.statusCode()).isEqualTo(599);
        assertThat(dto.statusText()).isEqualTo("599");
    }

    @SuppressWarnings("unchecked")
    private HttpResponse<String> createMockResponse(int statusCode, String statusText, String body, Map<String, List<String>> headers) {
        HttpResponse<String> response = mock(HttpResponse.class);
        HttpHeaders httpHeaders = HttpHeaders.of(headers, (k, v) -> true);

        when(response.statusCode()).thenReturn(statusCode);
        when(response.body()).thenReturn(body);
        when(response.headers()).thenReturn(httpHeaders);

        return response;
    }

    @SuppressWarnings("unchecked")
    private HttpResponse<String> createMockResponseWithContentLength(int statusCode, String body, Map<String, List<String>> headers, long contentLength) {
        HttpResponse<String> response = mock(HttpResponse.class);
        HttpHeaders httpHeaders = mock(HttpHeaders.class);

        when(response.statusCode()).thenReturn(statusCode);
        when(response.body()).thenReturn(body);
        when(response.headers()).thenReturn(httpHeaders);
        when(httpHeaders.map()).thenReturn(headers);
        when(httpHeaders.firstValue("Content-Type")).thenReturn(Optional.empty());
        when(httpHeaders.firstValue("X-Road-Id")).thenReturn(Optional.empty());
        when(httpHeaders.firstValue("X-Road-Request-Hash")).thenReturn(Optional.empty());
        when(httpHeaders.firstValue("X-Road-Request-Id")).thenReturn(Optional.empty());
        when(httpHeaders.firstValue("X-Road-Error")).thenReturn(Optional.empty());
        when(httpHeaders.firstValueAsLong("Content-Length")).thenReturn(OptionalLong.of(contentLength));

        return response;
    }
}
