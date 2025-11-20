package com.nortal.xroad.restapi.client.service.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SecurityServerUrlValidator.class)
@Documented
public @interface ValidSecurityServerUrl {
    String message() default "Must be valid HTTP/HTTPS URL (e.g., https://localhost:8443)";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
