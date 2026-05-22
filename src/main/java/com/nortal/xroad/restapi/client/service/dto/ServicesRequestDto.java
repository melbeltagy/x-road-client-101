package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;

public record ServicesRequestDto(
    @NotBlank(message = "Security server URL is required")
    @URL(message = "Must be a valid URL")
    String securityServerUrl,
    @NotNull(message = "Client subsystem is required")
    @Valid
    SubsystemIdDto clientSubsystem,
    @NotNull(message = "Service subsystem is required")
    @Valid
    SubsystemIdDto serviceSubsystem
) {}
