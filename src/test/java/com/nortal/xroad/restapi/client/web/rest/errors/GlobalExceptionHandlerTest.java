package com.nortal.xroad.restapi.client.web.rest.errors;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.ConnectException;
import java.net.http.HttpTimeoutException;
import javax.net.ssl.SSLException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleConnectionExceptionForHttpTimeoutReturnsServiceUnavailable() {
        HttpTimeoutException ex = new HttpTimeoutException("request timed out");

        ProblemDetail problem = handler.handleConnectionException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE.value());
        assertThat(problem.getTitle()).isEqualTo("Connection Error");
        assertThat(problem.getDetail()).isEqualTo("request timed out");
        assertThat(problem.getType().toString()).endsWith("/connection-error");
    }

    @Test
    void handleConnectionExceptionForConnectExceptionReturnsServiceUnavailable() {
        ConnectException ex = new ConnectException("connection refused");

        ProblemDetail problem = handler.handleConnectionException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE.value());
        assertThat(problem.getTitle()).isEqualTo("Connection Error");
        assertThat(problem.getDetail()).isEqualTo("connection refused");
    }

    @Test
    void handleSslExceptionReturnsBadRequest() {
        SSLException ex = new SSLException("handshake failure");

        ProblemDetail problem = handler.handleSslException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problem.getTitle()).isEqualTo("SSL Error");
        assertThat(problem.getDetail()).isEqualTo("handshake failure");
        assertThat(problem.getType().toString()).endsWith("/ssl-error");
    }

    @Test
    void handleInterruptedExceptionRestoresInterruptFlagAndReturnsServiceUnavailable() {
        // Ensure the thread starts in a non-interrupted state.
        Thread.interrupted();
        InterruptedException ex = new InterruptedException("interrupted");

        try {
            ProblemDetail problem = handler.handleInterruptedException(ex);

            assertThat(problem.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE.value());
            assertThat(problem.getTitle()).isEqualTo("Request Interrupted");
            assertThat(problem.getDetail()).isEqualTo("Request was interrupted");
            assertThat(problem.getType().toString()).endsWith("/request-interrupted");
            // The handler must restore the interrupt flag so the caller can react if needed.
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally {
            // Clear the flag so it doesn't leak into other tests.
            Thread.interrupted();
        }
    }

    @Test
    void handleIOExceptionReturnsInternalServerError() {
        IOException ex = new IOException("disk failure");

        ProblemDetail problem = handler.handleIOException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(problem.getTitle()).isEqualTo("I/O Error");
        assertThat(problem.getDetail()).isEqualTo("disk failure");
        assertThat(problem.getType().toString()).endsWith("/io-error");
    }

    @Test
    void problemTypeUriIsBuiltFromConfiguredBase() {
        ProblemDetail problem = handler.handleSslException(new SSLException("x"));

        assertThat(problem.getType().toString()).startsWith("https://api.xroad.example/problems/");
    }
}
