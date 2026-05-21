package com.nortal.xroad.restapi.client.service.util;

import java.io.IOException;
import java.io.StringReader;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import org.apache.commons.lang3.StringUtils;
import org.bouncycastle.asn1.pkcs.PrivateKeyInfo;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.openssl.PEMKeyPair;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;

public final class MTLSContextBuilder {

    private MTLSContextBuilder() {}

    public static SSLContext createSslContext(String securityServerCertPem, String clientCertPem, String clientPrivateKeyPem) {
        if (StringUtils.isAnyBlank(securityServerCertPem, clientCertPem, clientPrivateKeyPem)) {
            throw new IllegalArgumentException("All mTLS components (security server cert, client cert, client key) are required");
        }

        try {
            List<X509Certificate> clientCertificates = parseCertificates(clientCertPem);
            if (clientCertificates.isEmpty()) {
                throw new IllegalArgumentException("Client certificate is required but not found in provided PEM");
            }

            PrivateKey clientPrivateKey = parsePrivateKey(clientPrivateKeyPem);
            if (clientPrivateKey == null) {
                throw new IllegalArgumentException("Client private key is required but not found in provided PEM");
            }

            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            keyStore.load(null, null);
            keyStore.setKeyEntry("client", clientPrivateKey, new char[0], clientCertificates.toArray(new X509Certificate[0]));

            KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
            kmf.init(keyStore, new char[0]);

            // Permissive trust manager for self-signed certificates (development/testing)
            TrustManager[] trustManagers = new TrustManager[] {
                new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {}

                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {}

                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                },
            };

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(kmf.getKeyManagers(), trustManagers, null);
            return sslContext;
        } catch (
            CertificateException
            | IOException
            | KeyStoreException
            | NoSuchAlgorithmException
            | UnrecoverableKeyException
            | KeyManagementException e
        ) {
            throw new IllegalArgumentException("Failed to create SSL context from PEM certificates", e);
        }
    }

    private static List<X509Certificate> parseCertificates(String pem) throws IOException, CertificateException {
        List<X509Certificate> certificates = new ArrayList<>();
        JcaX509CertificateConverter converter = new JcaX509CertificateConverter();

        try (PEMParser parser = new PEMParser(new StringReader(pem))) {
            Object object;
            while ((object = parser.readObject()) != null) {
                if (object instanceof X509CertificateHolder holder) {
                    certificates.add(converter.getCertificate(holder));
                }
            }
        }
        return certificates;
    }

    private static PrivateKey parsePrivateKey(String pem) throws IOException {
        JcaPEMKeyConverter converter = new JcaPEMKeyConverter();

        try (PEMParser parser = new PEMParser(new StringReader(pem))) {
            Object object = parser.readObject();
            if (object instanceof PEMKeyPair keyPair) {
                return converter.getPrivateKey(keyPair.getPrivateKeyInfo());
            } else if (object instanceof PrivateKeyInfo keyInfo) {
                return converter.getPrivateKey(keyInfo);
            }
        }
        return null;
    }
}
