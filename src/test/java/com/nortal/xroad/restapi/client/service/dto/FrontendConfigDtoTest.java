package com.nortal.xroad.restapi.client.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FrontendConfigDtoTest {

    @Test
    void maxHistoryEntriesAccessor() {
        FrontendConfigDto dto = new FrontendConfigDto(25);

        assertThat(dto.maxHistoryEntries()).isEqualTo(25);
    }

    @Test
    void recordEquality() {
        FrontendConfigDto dto1 = new FrontendConfigDto(15);
        FrontendConfigDto dto2 = new FrontendConfigDto(15);
        FrontendConfigDto dto3 = new FrontendConfigDto(20);

        assertThat(dto1).isEqualTo(dto2);
        assertThat(dto1).isNotEqualTo(dto3);
    }

    @Test
    void recordToString() {
        FrontendConfigDto dto = new FrontendConfigDto(30);

        assertThat(dto.toString()).contains("30");
    }
}
