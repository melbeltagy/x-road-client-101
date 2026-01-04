package com.nortal.xroad.restapi.client.web.rest.errors;

import java.net.URI;

public final class ErrorConstants {

    public static final String ERR_VALIDATION = "error.validation";
    public static final String PROBLEM_BASE_URL = "https://www.rfc-editor.org/rfc/rfc7807";
    public static final URI DEFAULT_TYPE = URI.create(PROBLEM_BASE_URL + "#section-3.1");
    public static final URI CONSTRAINT_VIOLATION_TYPE = URI.create(PROBLEM_BASE_URL + "#section-3.1");

    private ErrorConstants() {}
}
