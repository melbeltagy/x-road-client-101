package com.nortal.xroad.restapi.client.service.util;

import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import org.springframework.http.HttpHeaders;

/**
 * Utility class for building X-Road protocol headers.
 */
public final class XRoadHeaderBuilder {

    private XRoadHeaderBuilder() {
        // Private constructor to prevent instantiation
    }

    /**
     * Build the X-Road-Client header value from a SubsystemIdDto.
     * Format: {instanceId}/{memberClass}/{memberCode}/{subsystemCode}
     *
     * @param subsystem the subsystem identifier
     * @return the X-Road-Client header value
     */
    public static String buildXRoadClientHeader(SubsystemIdDto subsystem) {
        return String.format(
            "%s/%s/%s/%s",
            subsystem.instanceId(),
            subsystem.memberClass(),
            subsystem.memberCode(),
            subsystem.subsystemCode()
        );
    }

    /**
     * Add X-Road protocol headers to the provided HttpHeaders instance.
     *
     * @param headers the HttpHeaders to add to
     * @param clientSubsystem the client subsystem identifier
     */
    public static void addXRoadHeaders(HttpHeaders headers, SubsystemIdDto clientSubsystem) {
        headers.set("X-Road-Client", buildXRoadClientHeader(clientSubsystem));
        // Add request ID for tracking (UUID)
        headers.set("X-Road-Request-Id", java.util.UUID.randomUUID().toString());
    }
}
