package com.nortal.xroad.restapi.client.service.dto.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Validator for Security Server URLs.
 * Uses Java's URI class for RFC 3986 compliant validation (similar to browser's URL constructor).
 */
public class SecurityServerUrlValidator implements ConstraintValidator<ValidSecurityServerUrl, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return false;
        }

        try {
            URI uri = new URI(value);

            // Must have a scheme
            String scheme = uri.getScheme();
            if (scheme == null) {
                setErrorMessage(context, "Must use HTTP or HTTPS protocol");
                return false;
            }

            // Must be http or https
            if (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https")) {
                setErrorMessage(context, "Must use HTTP or HTTPS protocol");
                return false;
            }

            // Must have a host
            String host = uri.getHost();
            if (host == null || host.isEmpty()) {
                setErrorMessage(context, "Hostname is required");
                return false;
            }

            // Hostname cannot contain underscores (RFC 952/1123)
            if (host.contains("_")) {
                setErrorMessage(context, "Invalid hostname: underscores not allowed");
                return false;
            }

            return true;
        } catch (URISyntaxException e) {
            setErrorMessage(context, "Must be valid HTTP/HTTPS URL (e.g., https://localhost:8443)");
            return false;
        }
    }

    private void setErrorMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}
