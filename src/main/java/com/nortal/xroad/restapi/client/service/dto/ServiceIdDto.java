package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record ServiceIdDto(
    @NotNull(message = "Service subsystem is required") @Valid SubsystemIdDto subsystem,
    @NotBlank(message = "Service code is required")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Must be alphanumeric, underscore, or hyphen")
    String serviceCode,
    @Pattern(regexp = "^v?[0-9]+(\\.[0-9]+)*$", message = "Invalid version format (e.g., v1, 1.2.3)") String serviceVersion
) {}
