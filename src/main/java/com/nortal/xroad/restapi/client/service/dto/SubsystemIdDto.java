package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SubsystemIdDto(
    @NotBlank(message = "Instance ID is required")
    @Pattern(regexp = "^[A-Za-z0-9-]{2,}$", message = "Must be alphanumeric or hyphen (min 2 chars)")
    String instanceId,
    @NotBlank(message = "Member class is required")
    @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Must be alphanumeric or hyphen")
    String memberClass,
    @NotBlank(message = "Member code is required")
    @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Must be alphanumeric or hyphen")
    String memberCode,
    @NotBlank(message = "Subsystem code is required")
    @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Must be alphanumeric or hyphen")
    String subsystemCode
) {}
