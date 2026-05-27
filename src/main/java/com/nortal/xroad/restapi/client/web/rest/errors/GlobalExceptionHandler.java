package com.nortal.xroad.restapi.client.web.rest.errors;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpTimeoutException;
import javax.net.ssl.SSLException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final String PROBLEM_BASE_URI = "https://api.xroad.example/problems/";

    @ExceptionHandler({ HttpTimeoutException.class, ConnectException.class })
    public ProblemDetail handleConnectionException(IOException ex) {
        log.error("Connection error: {}", ex.getMessage());
        return createProblem(HttpStatus.SERVICE_UNAVAILABLE, "connection-error", "Connection Error", ex.getMessage());
    }

    @ExceptionHandler(SSLException.class)
    public ProblemDetail handleSslException(SSLException ex) {
        log.error("SSL error: {}", ex.getMessage());
        return createProblem(HttpStatus.BAD_REQUEST, "ssl-error", "SSL Error", ex.getMessage());
    }

    @ExceptionHandler(InterruptedException.class)
    public ProblemDetail handleInterruptedException(InterruptedException ex) {
        Thread.currentThread().interrupt();
        log.error("Request interrupted: {}", ex.getMessage());
        return createProblem(HttpStatus.SERVICE_UNAVAILABLE, "request-interrupted", "Request Interrupted", "Request was interrupted");
    }

    @ExceptionHandler(IOException.class)
    public ProblemDetail handleIOException(IOException ex) {
        log.error("I/O error: {}", ex.getMessage());
        return createProblem(HttpStatus.INTERNAL_SERVER_ERROR, "io-error", "I/O Error", ex.getMessage());
    }

    private ProblemDetail createProblem(HttpStatus status, String type, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create(PROBLEM_BASE_URI + type));
        problem.setTitle(title);
        return problem;
    }
}
