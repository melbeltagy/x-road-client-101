package com.nortal.xroad.restapi.client.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Properties specific to X Road Example Restapi Client.
 * <p>
 * Properties are configured in the {@code application.yml} file.
 * See {@link AppProperties} for application-wide properties.
 */
@ConfigurationProperties(prefix = "application", ignoreUnknownFields = false)
public class ApplicationProperties {

    private final Xroad xroad = new Xroad();

    public Xroad getXroad() {
        return xroad;
    }

    public static class Xroad {

        private final Timeout timeout = new Timeout();

        public Timeout getTimeout() {
            return timeout;
        }

        public static class Timeout {

            private int connectMs = 60000; // 60 seconds default
            private int readMs = 120000; // 120 seconds default

            public int getConnectMs() {
                return connectMs;
            }

            public void setConnectMs(int connectMs) {
                this.connectMs = connectMs;
            }

            public int getReadMs() {
                return readMs;
            }

            public void setReadMs(int readMs) {
                this.readMs = readMs;
            }
        }
    }
}
