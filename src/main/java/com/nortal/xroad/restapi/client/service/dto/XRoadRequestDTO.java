package com.nortal.xroad.restapi.client.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record XRoadRequestDTO(
    @NotNull(message = "Client identifier is required") @Valid ClientDto client,
    @NotNull(message = "Service identifier is required") @Valid ServiceIdDto service,
    @NotNull(message = "Request details are required") @Valid RequestDetailsDto request
) {}
