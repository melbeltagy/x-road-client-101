package com.nortal.xroad.restapi.client.web.controller;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.FrontendConfigDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ConfigController {

    private final ApplicationProperties applicationProperties;

    @GetMapping
    public ResponseEntity<FrontendConfigDto> getConfig() {
        log.debug("REST request to get frontend configuration");
        return ResponseEntity.ok(new FrontendConfigDto(
            applicationProperties.getFrontend().getMaxHistoryEntries()
        ));
    }
}
