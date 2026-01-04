package com.nortal.xroad.restapi.client.web.rest.errors;

import java.net.URI;
import org.springframework.http.ProblemDetail;

/**
 * Extended ProblemDetail that includes cause information for debugging.
 * Based on RFC 7807.
 */
public class ProblemDetailWithCause extends ProblemDetail {

    private ProblemDetailWithCause cause;

    public ProblemDetailWithCause getCause() {
        return cause;
    }

    public void setCause(ProblemDetailWithCause cause) {
        this.cause = cause;
    }

    public static final class ProblemDetailWithCauseBuilder {

        private final ProblemDetailWithCause problemDetail;

        private ProblemDetailWithCauseBuilder() {
            this.problemDetail = new ProblemDetailWithCause();
        }

        public static ProblemDetailWithCauseBuilder instance() {
            return new ProblemDetailWithCauseBuilder();
        }

        public ProblemDetailWithCauseBuilder withStatus(int status) {
            problemDetail.setStatus(status);
            return this;
        }

        public ProblemDetailWithCauseBuilder withType(URI type) {
            problemDetail.setType(type);
            return this;
        }

        public ProblemDetailWithCauseBuilder withTitle(String title) {
            problemDetail.setTitle(title);
            return this;
        }

        public ProblemDetailWithCauseBuilder withDetail(String detail) {
            problemDetail.setDetail(detail);
            return this;
        }

        public ProblemDetailWithCauseBuilder withInstance(URI instance) {
            problemDetail.setInstance(instance);
            return this;
        }

        public ProblemDetailWithCauseBuilder withCause(ProblemDetailWithCause cause) {
            problemDetail.setCause(cause);
            return this;
        }

        public ProblemDetailWithCauseBuilder withProperty(String key, Object value) {
            problemDetail.setProperty(key, value);
            return this;
        }

        public ProblemDetailWithCause build() {
            return problemDetail;
        }
    }
}
