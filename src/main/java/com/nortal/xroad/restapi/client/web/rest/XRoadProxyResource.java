package com.nortal.xroad.restapi.client.web.rest;

import com.nortal.xroad.restapi.client.service.XRoadProxyService;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

/**
 * REST controller for proxying X-Road requests to Security Server.
 */
@RestController
@RequestMapping("/api/xroad")
public class XRoadProxyResource {

    private static final Logger log = LoggerFactory.getLogger(XRoadProxyResource.class);

    private final XRoadProxyService xroadProxyService;

    public XRoadProxyResource(XRoadProxyService xroadProxyService) {
        this.xroadProxyService = xroadProxyService;
    }

    /**
     * POST /api/xroad/execute : Execute X-Road request through Security Server
     *
     * @param request the X-Road request (validated)
     * @return the ResponseEntity with status 200 (OK) and X-Road response in body
     */
    @PostMapping("/execute")
    public Mono<ResponseEntity<XRoadResponseDTO>> executeXRoadRequest(@Valid @RequestBody XRoadRequestDTO request) {
        log.debug(
            "REST request to execute X-Road service: {}/{}",
            request.service().subsystem().subsystemCode(),
            request.service().serviceCode()
        );

        return xroadProxyService
            .executeRequest(request)
            .map(response -> ResponseEntity.ok().body(response))
            .onErrorResume(WebClientRequestException.class, ex -> {
                // Connection refused, timeout, DNS error
                log.error("X-Road connection error: {}", ex.getMessage());
                return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(createErrorResponse(ex, "Connection error")));
            })
            .onErrorResume(WebClientResponseException.class, ex -> {
                // HTTP error response from Security Server
                log.error("X-Road server error: {} - {}", ex.getStatusCode(), ex.getMessage());
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(createErrorResponse(ex, "Server error")));
            })
            .onErrorResume(IllegalArgumentException.class, ex -> {
                // SSL/certificate errors
                log.error("X-Road SSL error: {}", ex.getMessage());
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse(ex, "SSL error")));
            })
            .onErrorResume(WebClientException.class, ex -> {
                // Other WebClient errors
                log.error("X-Road request error: {}", ex.getMessage());
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse(ex, "Request error")));
            })
            .onErrorResume(Exception.class, ex -> {
                // Unexpected errors
                log.error("Unexpected error executing X-Road request", ex);
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse(ex, "Unexpected error")));
            });
    }

    /**
     * Create error response DTO from exception.
     */
    private XRoadResponseDTO createErrorResponse(Exception ex, String errorType) {
        return new XRoadResponseDTO(
            0, // status code 0 indicates client-side error
            errorType,
            java.util.Map.of(), // Empty map instead of null
            ex.getMessage(),
            "text/plain",
            null,
            null,
            null,
            null,
            null,
            java.time.Instant.now()
        );
    }
}
