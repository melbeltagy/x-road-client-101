package com.nortal.xroad.restapi.client.service.mapper;

import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto;
import com.nortal.xroad.restapi.client.service.dto.ClientListResponseDto.MemberEntry;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SubsystemIdMapper {

    private static final String OBJECT_TYPE_SUBSYSTEM = "SUBSYSTEM";

    public List<SubsystemIdDto> toList(ClientListResponseDto response) {
        if (response == null || response.member() == null) {
            return List.of();
        }

        return response.member().stream()
            .filter(this::isValidSubsystem)
            .map(this::toDto)
            .toList();
    }

    private boolean isValidSubsystem(MemberEntry member) {
        return member.id() != null
            && OBJECT_TYPE_SUBSYSTEM.equals(member.id().objectType())
            && member.id().subsystemCode() != null
            && !member.id().subsystemCode().isEmpty();
    }

    private SubsystemIdDto toDto(MemberEntry member) {
        return new SubsystemIdDto(
            member.id().xroadInstance(),
            member.id().memberClass(),
            member.id().memberCode(),
            member.id().subsystemCode()
        );
    }
}
