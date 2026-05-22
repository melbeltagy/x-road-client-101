package com.nortal.xroad.restapi.client.service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto.MemberEntry;
import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto.MemberId;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SubsystemIdMapperTest {

    private SubsystemIdMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new SubsystemIdMapper();
    }

    @Test
    void mapsValidSubsystems() {
        ClientListResponseDto response = new ClientListResponseDto(
            List.of(
                new MemberEntry(new MemberId("SUBSYSTEM", "TEST", "GOV", "123456", "TestSubsystem")),
                new MemberEntry(new MemberId("SUBSYSTEM", "TEST", "COM", "789012", "OtherSubsystem"))
            )
        );

        List<SubsystemIdDto> result = mapper.toList(response);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).instanceId()).isEqualTo("TEST");
        assertThat(result.get(0).memberClass()).isEqualTo("GOV");
        assertThat(result.get(0).memberCode()).isEqualTo("123456");
        assertThat(result.get(0).subsystemCode()).isEqualTo("TestSubsystem");
        assertThat(result.get(1).subsystemCode()).isEqualTo("OtherSubsystem");
    }

    @Test
    void filtersMemberTypeEntries() {
        ClientListResponseDto response = new ClientListResponseDto(
            List.of(
                new MemberEntry(new MemberId("SUBSYSTEM", "TEST", "GOV", "123456", "TestSubsystem")),
                new MemberEntry(new MemberId("MEMBER", "TEST", "GOV", "789012", null))
            )
        );

        List<SubsystemIdDto> result = mapper.toList(response);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().memberCode()).isEqualTo("123456");
    }

    @Test
    void filtersEntriesWithEmptySubsystemCode() {
        ClientListResponseDto response = new ClientListResponseDto(
            List.of(
                new MemberEntry(new MemberId("SUBSYSTEM", "TEST", "GOV", "123456", "TestSubsystem")),
                new MemberEntry(new MemberId("SUBSYSTEM", "TEST", "GOV", "789012", "")),
                new MemberEntry(new MemberId("SUBSYSTEM", "TEST", "GOV", "999999", null))
            )
        );

        List<SubsystemIdDto> result = mapper.toList(response);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().memberCode()).isEqualTo("123456");
    }

    @Test
    void returnsEmptyListForNullResponse() {
        List<SubsystemIdDto> result = mapper.toList(null);

        assertThat(result).isEmpty();
    }

    @Test
    void returnsEmptyListForNullMemberList() {
        ClientListResponseDto response = new ClientListResponseDto(null);

        List<SubsystemIdDto> result = mapper.toList(response);

        assertThat(result).isEmpty();
    }

    @Test
    void returnsEmptyListForEmptyMemberList() {
        ClientListResponseDto response = new ClientListResponseDto(List.of());

        List<SubsystemIdDto> result = mapper.toList(response);

        assertThat(result).isEmpty();
    }
}
