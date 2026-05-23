package com.nortal.xroad.restapi.client.web.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.FrontendConfigDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

class ConfigControllerTest {

    private ApplicationProperties applicationProperties;
    private ConfigController controller;

    @BeforeEach
    void setUp() {
        applicationProperties = new ApplicationProperties();
        controller = new ConfigController(applicationProperties);
    }

    @Test
    void getConfigReturnsDefaultMaxHistoryEntries() {
        ResponseEntity<FrontendConfigDto> result = controller.getConfig();

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().maxHistoryEntries()).isEqualTo(15);
    }

    @Test
    void getConfigReturnsConfiguredMaxHistoryEntries() {
        applicationProperties.getFrontend().setMaxHistoryEntries(50);

        ResponseEntity<FrontendConfigDto> result = controller.getConfig();

        assertThat(result.getStatusCode().value()).isEqualTo(200);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().maxHistoryEntries()).isEqualTo(50);
    }
}
