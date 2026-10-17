package io.github.melbeltagy.xroad.restapi.client.service.dto;

import io.github.melbeltagy.xroad.restapi.client.service.dto.validation.ValidSecurityServerUrl;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClientDto(
    @NotNull(message = "Client subsystem is required") @Valid SubsystemIdDto subsystem,
    @NotBlank(message = "Security Server URL is required") @ValidSecurityServerUrl String securityServerUrl,
    @Valid MTLsCertificatesDto mtlsCertificates
) {}
