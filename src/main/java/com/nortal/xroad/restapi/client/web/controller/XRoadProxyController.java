package com.nortal.xroad.restapi.client.web.controller;

import com.nortal.xroad.restapi.client.service.XRoadProxyService;
import com.nortal.xroad.restapi.client.service.dto.XRoadRequestDTO;
import com.nortal.xroad.restapi.client.service.dto.XRoadResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/xroad")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class XRoadProxyController {

    private final XRoadProxyService xroadProxyService;

    @PostMapping("/execute")
    public ResponseEntity<XRoadResponseDTO> executeXRoadRequest(@Valid @RequestBody XRoadRequestDTO request) {
        log.debug(
            "REST request to execute X-Road service: {}/{}",
            request.service().subsystem().subsystemCode(),
            request.service().serviceCode()
        );
        return ResponseEntity.ok(xroadProxyService.executeRequest(request));
    }
}
