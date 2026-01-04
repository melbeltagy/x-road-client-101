package com.nortal.xroad.restapi.client.config;

import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourcesWebConfiguration implements WebMvcConfigurer {

    private static final String[] RESOURCE_LOCATIONS = { "classpath:/static/", "classpath:/static/content/", "classpath:/static/i18n/" };
    private static final String[] RESOURCE_PATHS = { "/*.js", "/*.css", "/*.svg", "/*.png", "*.ico", "/content/**", "/i18n/*" };
    private static final int CACHE_TTL_DAYS = 30;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry
            .addResourceHandler(RESOURCE_PATHS)
            .addResourceLocations(RESOURCE_LOCATIONS)
            .setCacheControl(CacheControl.maxAge(CACHE_TTL_DAYS, TimeUnit.DAYS).cachePublic());
    }
}
