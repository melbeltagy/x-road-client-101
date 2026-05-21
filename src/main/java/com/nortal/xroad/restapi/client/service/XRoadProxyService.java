package com.nortal.xroad.restapi.client.service;

import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import com.nortal.xroad.restapi.client.service.mapper.XRoadRequestMapper;
import com.nortal.xroad.restapi.client.service.mapper.XRoadResponseMapper;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class XRoadProxyService {

    private final HttpClientFactory httpClientFactory;
    private final XRoadRequestMapper requestMapper;
    private final XRoadResponseMapper responseMapper;

    public XRoadResponseDTO executeRequest(XRoadRequestDTO request) throws IOException, InterruptedException {
        log.debug("Executing X-Road request to service: {}", request.service().serviceCode());

        HttpRequest httpRequest = requestMapper.toHttpRequest(request);
        log.debug("X-Road URL: {}", httpRequest.uri());

        try (HttpClient httpClient = httpClientFactory.create(request.client())) {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            return responseMapper.toDto(response);
        }
    }
}
