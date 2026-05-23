package com.nortal.xroad.restapi.client.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@ConfigurationProperties(prefix = "application", ignoreUnknownFields = false)
public class ApplicationProperties {

    private final Xroad xroad = new Xroad();
    private final Frontend frontend = new Frontend();

    @Getter
    public static class Xroad {

        private final Timeout timeout = new Timeout();

        @Getter
        @Setter
        public static class Timeout {

            private int connectMs = 60000;
            private int readMs = 120000;
        }
    }

    @Getter
    @Setter
    public static class Frontend {

        private int maxHistoryEntries = 15;
    }
}
