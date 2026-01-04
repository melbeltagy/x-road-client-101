package com.nortal.xroad.restapi.client.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Application-wide properties configured in application.yml.
 * Application-wide properties.
 */
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final ClientApp clientApp = new ClientApp();
    private final Cors cors = new Cors();

    public ClientApp getClientApp() {
        return clientApp;
    }

    public Cors getCors() {
        return cors;
    }

    public static class ClientApp {

        private String name = "xRoadExampleRestapiClientApp";

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    public static class Cors {

        private String[] allowedOrigins = {};
        private String[] allowedMethods = { "*" };
        private String[] allowedHeaders = { "*" };
        private String[] exposedHeaders = {};
        private boolean allowCredentials = true;
        private long maxAge = 1800;

        public String[] getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String[] allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }

        public String[] getAllowedMethods() {
            return allowedMethods;
        }

        public void setAllowedMethods(String[] allowedMethods) {
            this.allowedMethods = allowedMethods;
        }

        public String[] getAllowedHeaders() {
            return allowedHeaders;
        }

        public void setAllowedHeaders(String[] allowedHeaders) {
            this.allowedHeaders = allowedHeaders;
        }

        public String[] getExposedHeaders() {
            return exposedHeaders;
        }

        public void setExposedHeaders(String[] exposedHeaders) {
            this.exposedHeaders = exposedHeaders;
        }

        public boolean isAllowCredentials() {
            return allowCredentials;
        }

        public void setAllowCredentials(boolean allowCredentials) {
            this.allowCredentials = allowCredentials;
        }

        public long getMaxAge() {
            return maxAge;
        }

        public void setMaxAge(long maxAge) {
            this.maxAge = maxAge;
        }
    }
}
