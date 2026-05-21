package com.nortal.xroad.restapi.client.service;

import com.nortal.xroad.restapi.client.config.ApplicationProperties;
import com.nortal.xroad.restapi.client.service.dto.ClientDto;
import com.nortal.xroad.restapi.client.service.dto.MTLsCertificatesDto;
import com.nortal.xroad.restapi.client.service.util.MTLSContextBuilder;
import java.net.http.HttpClient;
import java.time.Duration;
import javax.net.ssl.SSLContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class HttpClientFactory {

    private final ApplicationProperties applicationProperties;

    public HttpClient create(ClientDto client) {
        HttpClient.Builder builder = HttpClient.newBuilder().connectTimeout(
            Duration.ofMillis(applicationProperties.getXroad().getTimeout().getConnectMs())
        );

        if (client.mtlsCertificates() != null) {
            MTLsCertificatesDto certs = client.mtlsCertificates();
            if (StringUtils.isNoneBlank(certs.securityServerCert(), certs.clientCert(), certs.clientPrivateKey())) {
                log.debug("Configuring mTLS");
                SSLContext sslContext = MTLSContextBuilder.createSslContext(
                    certs.securityServerCert(),
                    certs.clientCert(),
                    certs.clientPrivateKey()
                );
                builder.sslContext(sslContext);
            }
        }

        return builder.build();
    }
}
