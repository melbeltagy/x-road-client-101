package com.nortal.xroad.restapi.client.service.dto;

/**
 * DTO for mTLS certificates required for X-Road Security Server connection.
 * Contains separate fields for each certificate type.
 * All fields are optional - if provided, all three must be present for mTLS to work.
 */
public record MTlsCertificatesDto(
    String securityServerCert, // Security Server's public certificate (for verification)
    String clientCert, // Client's public certificate
    String clientPrivateKey // Client's private key
) {}
