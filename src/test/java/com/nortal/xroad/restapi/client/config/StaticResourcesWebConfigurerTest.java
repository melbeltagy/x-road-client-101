package com.nortal.xroad.restapi.client.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockServletContext;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

class StaticResourcesWebConfigurerTest {

    private StaticResourcesWebConfiguration staticResourcesWebConfiguration;
    private ResourceHandlerRegistry resourceHandlerRegistry;

    @BeforeEach
    void setUp() {
        MockServletContext servletContext = spy(new MockServletContext());
        WebApplicationContext applicationContext = mock(WebApplicationContext.class);
        resourceHandlerRegistry = spy(new ResourceHandlerRegistry(applicationContext, servletContext));
        staticResourcesWebConfiguration = new StaticResourcesWebConfiguration();
    }

    @Test
    void shouldRegisterResourceHandlers() {
        staticResourcesWebConfiguration.addResourceHandlers(resourceHandlerRegistry);

        assertThat(resourceHandlerRegistry.hasMappingForPattern("/*.js")).isTrue();
        assertThat(resourceHandlerRegistry.hasMappingForPattern("/*.css")).isTrue();
        assertThat(resourceHandlerRegistry.hasMappingForPattern("/content/**")).isTrue();
        assertThat(resourceHandlerRegistry.hasMappingForPattern("/i18n/*")).isTrue();
    }
}
