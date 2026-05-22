package com.nortal.xroad.restapi.client.service;

import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import com.nortal.xroad.restapi.client.service.mapper.XRoadRequestMapper;
import com.nortal.xroad.restapi.client.service.mapper.XRoadResponseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class XRoadProxyService {

    private final RestClientFactory restClientFactory;
    private final XRoadRequestMapper requestMapper;
    private final XRoadResponseMapper responseMapper;

    public XRoadResponseDTO executeRequest(XRoadRequestDTO request) {
        log.debug("Executing X-Road request to service: {}", request.service().serviceCode());

        RestClient restClient = restClientFactory.create(request.client());

        String url = requestMapper.buildUrl(request);
        HttpMethod method = HttpMethod.valueOf(request.request().method().name());

        log.debug("X-Road Request - Method: {}, URL: {}", method, url);

        return restClient.method(method)
            .uri(url)
            .headers(headers -> requestMapper.addHeaders(headers, request))
            .body(request.request().body() != null ? request.request().body() : "")
            .exchange((clientRequest, clientResponse) -> {
                log.debug("X-Road Response - Status: {}", clientResponse.getStatusCode().value());
                return responseMapper.toDto(clientResponse);
            });
    }
}
