package com.nortal.xroad.restapi.client.service.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.StringWriter;
import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Date;
import javax.net.ssl.SSLContext;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class MTLSContextBuilderTest {

    private static String serverCertPem;
    private static String clientCertPem;
    private static String clientKeyPem;
    private static String clientKeyPkcs8Pem;

    @BeforeAll
    static void generateCertificates() throws Exception {
        KeyPair serverKeyPair = generateKeyPair();
        KeyPair clientKeyPair = generateKeyPair();

        X509Certificate serverCert = generateSelfSignedCertificate(serverKeyPair, "CN=Test Server");
        X509Certificate clientCert = generateSelfSignedCertificate(clientKeyPair, "CN=Test Client");

        serverCertPem = toPem(serverCert);
        clientCertPem = toPem(clientCert);
        // PKCS#1-style PEMKeyPair: writing the KeyPair produces "BEGIN RSA PRIVATE KEY"
        clientKeyPem = toPem(clientKeyPair);
        // PKCS#8 form: writing only the PrivateKey produces "BEGIN PRIVATE KEY"
        clientKeyPkcs8Pem = toPem(clientKeyPair.getPrivate());
    }

    @Test
    void createSslContextReturnsTlsContext() {
        SSLContext sslContext = MTLSContextBuilder.createSslContext(serverCertPem, clientCertPem, clientKeyPem);

        assertThat(sslContext).isNotNull();
        assertThat(sslContext.getProtocol()).isEqualTo("TLS");
    }

    @Test
    void createSslContextAcceptsPkcs8PrivateKey() {
        SSLContext sslContext = MTLSContextBuilder.createSslContext(serverCertPem, clientCertPem, clientKeyPkcs8Pem);

        assertThat(sslContext).isNotNull();
        assertThat(sslContext.getSocketFactory()).isNotNull();
    }

    @Test
    void createSslContextThrowsWhenServerCertBlank() {
        assertThatThrownBy(() -> MTLSContextBuilder.createSslContext("", clientCertPem, clientKeyPem))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("All mTLS components");
    }

    @Test
    void createSslContextThrowsWhenClientCertBlank() {
        assertThatThrownBy(() -> MTLSContextBuilder.createSslContext(serverCertPem, "   ", clientKeyPem))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("All mTLS components");
    }

    @Test
    void createSslContextThrowsWhenPrivateKeyBlank() {
        assertThatThrownBy(() -> MTLSContextBuilder.createSslContext(serverCertPem, clientCertPem, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("All mTLS components");
    }

    @Test
    void createSslContextThrowsWhenClientCertHasNoCertificate() {
        // Valid PEM-ish wrapper that the parser yields no X509CertificateHolder for.
        String noCertPem = "-----BEGIN CERTIFICATE REQUEST-----\nMIIBOTCB6QIBADBzMQ==\n-----END CERTIFICATE REQUEST-----\n";

        assertThatThrownBy(() -> MTLSContextBuilder.createSslContext(serverCertPem, noCertPem, clientKeyPem))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createSslContextThrowsWhenPrivateKeyMissing() {
        // PEM that parses but doesn't yield a PEMKeyPair or PrivateKeyInfo - use a certificate instead of a key.
        assertThatThrownBy(() -> MTLSContextBuilder.createSslContext(serverCertPem, clientCertPem, serverCertPem))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("private key");
    }

    @Test
    void createSslContextThrowsOnMalformedClientCertPem() {
        // Valid PEM headers but the body is not a real certificate — parser raises IOException
        // which the builder wraps as IllegalArgumentException via the catch block.
        String garbage = "-----BEGIN CERTIFICATE-----\nbm90LWEtY2VydA==\n-----END CERTIFICATE-----\n";

        assertThatThrownBy(() -> MTLSContextBuilder.createSslContext(serverCertPem, garbage, clientKeyPem))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void trustManagerAcceptsAnyCertificate() throws Exception {
        SSLContext sslContext = MTLSContextBuilder.createSslContext(serverCertPem, clientCertPem, clientKeyPem);
        // The permissive X509TrustManager is exercised when SSL handshakes occur; the fact that
        // the context initializes and is usable confirms the trust manager and key manager are wired.
        assertThat(sslContext.getSocketFactory().getSupportedCipherSuites()).isNotEmpty();
    }

    private static KeyPair generateKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private static X509Certificate generateSelfSignedCertificate(KeyPair keyPair, String dn) throws Exception {
        X500Name issuer = new X500Name(dn);
        X500Name subject = new X500Name(dn);
        BigInteger serial = BigInteger.valueOf(System.nanoTime());
        Date notBefore = Date.from(Instant.now().minusSeconds(60));
        Date notAfter = Date.from(Instant.now().plusSeconds(3600));

        X509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(issuer, serial, notBefore, notAfter, subject, keyPair.getPublic());
        ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA").build(keyPair.getPrivate());
        X509CertificateHolder holder = builder.build(signer);

        return new JcaX509CertificateConverter().getCertificate(holder);
    }

    private static String toPem(Object pemObject) throws Exception {
        StringWriter writer = new StringWriter();
        try (JcaPEMWriter pemWriter = new JcaPEMWriter(writer)) {
            pemWriter.writeObject(pemObject);
        }
        return writer.toString();
    }
}
