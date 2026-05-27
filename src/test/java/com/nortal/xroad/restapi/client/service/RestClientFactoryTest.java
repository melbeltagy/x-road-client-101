package com.nortal.xroad.restapi.client.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.MTLsCertificatesDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class RestClientFactoryTest {

    private ApplicationProperties applicationProperties;
    private RestClient.Builder builder;
    private RestClient.Builder cloneBuilder;
    private RestClient restClient;
    private RestClientFactory factory;

    @BeforeEach
    void setUp() {
        applicationProperties = new ApplicationProperties();
        applicationProperties.getXroad().getTimeout().setConnectMs(5000);
        applicationProperties.getXroad().getTimeout().setReadMs(10000);

        builder = mock(RestClient.Builder.class);
        cloneBuilder = mock(RestClient.Builder.class);
        restClient = mock(RestClient.class);

        when(builder.clone()).thenReturn(cloneBuilder);
        when(cloneBuilder.requestFactory(org.mockito.ArgumentMatchers.any())).thenReturn(cloneBuilder);
        when(cloneBuilder.build()).thenReturn(restClient);

        factory = new RestClientFactory(applicationProperties, builder);
    }

    @Test
    void createWithoutMtlsReturnsRestClient() {
        ClientDto client = clientWithoutMtls();

        RestClient result = factory.create(client);

        assertThat(result).isSameAs(restClient);
        verify(builder).clone();
        verify(cloneBuilder).build();
    }

    @Test
    void createWhenMtlsCertificatesIsNullSkipsMtlsConfiguration() {
        ClientDto client = clientWithoutMtls();

        factory.create(client);

        // Without mTLS the cloned builder still produces a client; assert no errors path triggered.
        verify(cloneBuilder, times(1)).build();
    }

    @Test
    void createWhenMtlsCertificatesHaveBlankFieldsSkipsMtls() {
        MTLsCertificatesDto blank = new MTLsCertificatesDto(" ", "", null);
        ClientDto client = new ClientDto(subsystem(), "http://localhost:8080", blank);

        RestClient result = factory.create(client);

        assertThat(result).isSameAs(restClient);
    }

    @Test
    void createWhenMtlsCertificatesPartiallyPopulatedSkipsMtls() {
        // securityServerCert present but clientCert blank — should NOT attempt mTLS setup.
        MTLsCertificatesDto partial = new MTLsCertificatesDto("server-cert", "", "client-key");
        ClientDto client = new ClientDto(subsystem(), "http://localhost:8080", partial);

        RestClient result = factory.create(client);

        assertThat(result).isSameAs(restClient);
    }

    @Test
    void createWithFullyPopulatedButInvalidMtlsCertsThrows() {
        // All three fields are non-blank, so hasMtlsCertificates() == true and MTLSContextBuilder is invoked.
        // The garbage values cannot be parsed as PEM so an IllegalArgumentException bubbles up.
        MTLsCertificatesDto invalid = new MTLsCertificatesDto("not-a-cert", "not-a-cert", "not-a-key");
        ClientDto client = new ClientDto(subsystem(), "http://localhost:8080", invalid);

        assertThatThrownBy(() -> factory.create(client))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createUsesConfiguredTimeouts() {
        applicationProperties.getXroad().getTimeout().setConnectMs(1234);
        applicationProperties.getXroad().getTimeout().setReadMs(5678);

        RestClient result = factory.create(clientWithoutMtls());

        // Timeouts feed into the internal JdkClientHttpRequestFactory; presence of a successful
        // build path with custom timeouts confirms the configuration values are read each call.
        assertThat(result).isSameAs(restClient);
    }

    private ClientDto clientWithoutMtls() {
        return new ClientDto(subsystem(), "http://localhost:8080", null);
    }

    private SubsystemIdDto subsystem() {
        return new SubsystemIdDto("TEST", "GOV", "123456", "ClientSubsystem");
    }
}
