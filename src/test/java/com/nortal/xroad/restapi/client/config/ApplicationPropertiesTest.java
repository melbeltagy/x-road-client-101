package com.nortal.xroad.restapi.client.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ApplicationPropertiesTest {

    @Test
    void defaultFrontendMaxHistoryEntries() {
        ApplicationProperties properties = new ApplicationProperties();

        assertThat(properties.getFrontend().getMaxHistoryEntries()).isEqualTo(15);
    }

    @Test
    void setFrontendMaxHistoryEntries() {
        ApplicationProperties properties = new ApplicationProperties();
        properties.getFrontend().setMaxHistoryEntries(100);

        assertThat(properties.getFrontend().getMaxHistoryEntries()).isEqualTo(100);
    }

    @Test
    void defaultXroadTimeoutValues() {
        ApplicationProperties properties = new ApplicationProperties();

        assertThat(properties.getXroad().getTimeout().getConnectMs()).isEqualTo(60000);
        assertThat(properties.getXroad().getTimeout().getReadMs()).isEqualTo(120000);
    }

    @Test
    void setXroadTimeoutValues() {
        ApplicationProperties properties = new ApplicationProperties();
        properties.getXroad().getTimeout().setConnectMs(30000);
        properties.getXroad().getTimeout().setReadMs(90000);

        assertThat(properties.getXroad().getTimeout().getConnectMs()).isEqualTo(30000);
        assertThat(properties.getXroad().getTimeout().getReadMs()).isEqualTo(90000);
    }
}
