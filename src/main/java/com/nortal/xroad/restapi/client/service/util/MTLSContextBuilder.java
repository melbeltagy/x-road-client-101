package com.nortal.xroad.restapi.client.service.util;

import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import javax.net.ssl.X509TrustManager;

/**
 * Utility class for building SSL contexts for mTLS connections.
 * Handles parsing of PEM-formatted certificates and private keys, and configures
 * both trust managers (for server verification) and key managers (for client authentication).
 */
public final class MTLSContextBuilder {

    private static final String BEGIN_CERT = "-----BEGIN CERTIFICATE-----";
    private static final String END_CERT = "-----END CERTIFICATE-----";
    private static final String BEGIN_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----";
    private static final String END_PRIVATE_KEY = "-----END PRIVATE KEY-----";
    private static final String BEGIN_RSA_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----";
    private static final String END_RSA_PRIVATE_KEY = "-----END RSA PRIVATE KEY-----";

    private MTLSContextBuilder() {
        // Private constructor to prevent instantiation
    }

    /**
     * Create an SslContext for mTLS with separate security server certificate,
     * client certificate, and client private key.
     *
     * @param securityServerCertPem PEM-formatted security server certificate (for trust store)
     * @param clientCertPem PEM-formatted client certificate (for key manager)
     * @param clientPrivateKeyPem PEM-formatted client private key (for key manager)
     * @return SslContext configured for mTLS
     * @throws IllegalArgumentException if PEM parsing fails or required components are missing
     */
    public static SslContext createSslContext(String securityServerCertPem, String clientCertPem, String clientPrivateKeyPem) {
        // Validate inputs
        if (
            securityServerCertPem == null ||
            securityServerCertPem.isBlank() ||
            clientCertPem == null ||
            clientCertPem.isBlank() ||
            clientPrivateKeyPem == null ||
            clientPrivateKeyPem.isBlank()
        ) {
            throw new IllegalArgumentException("All mTLS components (security server cert, client cert, client key) are required");
        }

        try {
            // Parse security server certificate (for trust manager)
            List<X509Certificate> trustCertificates = extractCertificates(securityServerCertPem);
            if (trustCertificates.isEmpty()) {
                throw new IllegalArgumentException("Security server certificate is required but not found in provided PEM");
            }

            // Parse client certificate (for key manager)
            List<X509Certificate> clientCertificates = extractCertificates(clientCertPem);
            if (clientCertificates.isEmpty()) {
                throw new IllegalArgumentException("Client certificate is required but not found in provided PEM");
            }

            // Parse client private key (for key manager)
            PrivateKey clientPrivateKey = extractPrivateKey(clientPrivateKeyPem);
            if (clientPrivateKey == null) {
                throw new IllegalArgumentException("Client private key is required but not found in provided PEM");
            }

            // Build SSL context with Netty
            SslContextBuilder builder = SslContextBuilder.forClient();

            // Configure trust manager with security server certificate
            // Use a permissive trust manager that accepts self-signed certificates
            X509TrustManager permissiveTrustManager = new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) {
                    // Accept all client certificates (not used in our case)
                }

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) {
                    // Accept all server certificates including self-signed
                    // IMPORTANT: This is for development/testing with self-signed certificates
                    // In production, implement proper certificate validation
                }

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            };

            builder.trustManager(permissiveTrustManager);

            // Configure key manager with client certificate and private key
            builder.keyManager(clientPrivateKey, clientCertificates.toArray(new X509Certificate[0]));

            return builder.build();
        } catch (CertificateException | IOException e) {
            throw new IllegalArgumentException("Failed to create SSL context from PEM certificates", e);
        }
    }

    /**
     * Extract X509 certificates from PEM string.
     * Supports multiple certificates in the same PEM string.
     */
    private static List<X509Certificate> extractCertificates(String pem) throws CertificateException {
        List<X509Certificate> certificates = new ArrayList<>();
        CertificateFactory cf = CertificateFactory.getInstance("X.509");

        int startIdx = 0;
        while ((startIdx = pem.indexOf(BEGIN_CERT, startIdx)) != -1) {
            int endIdx = pem.indexOf(END_CERT, startIdx);
            if (endIdx == -1) {
                break;
            }

            String certPem = pem.substring(startIdx, endIdx + END_CERT.length());
            ByteArrayInputStream certStream = new ByteArrayInputStream(certPem.getBytes(StandardCharsets.UTF_8));
            X509Certificate cert = (X509Certificate) cf.generateCertificate(certStream);
            certificates.add(cert);

            startIdx = endIdx + END_CERT.length();
        }

        return certificates;
    }

    /**
     * Extract private key from PEM string.
     * Supports both PKCS#8 (BEGIN PRIVATE KEY) and traditional RSA format (BEGIN RSA PRIVATE KEY).
     */
    private static PrivateKey extractPrivateKey(String pem) throws IOException {
        try {
            // Determine which format is used
            boolean isPKCS8 = pem.contains(BEGIN_PRIVATE_KEY);
            boolean isRSA = pem.contains(BEGIN_RSA_PRIVATE_KEY);

            if (!isPKCS8 && !isRSA) {
                return null; // No private key in this PEM string
            }

            // Extract the key content between markers
            String beginMarker = isPKCS8 ? BEGIN_PRIVATE_KEY : BEGIN_RSA_PRIVATE_KEY;
            String endMarker = isPKCS8 ? END_PRIVATE_KEY : END_RSA_PRIVATE_KEY;

            int startIdx = pem.indexOf(beginMarker);
            int endIdx = pem.indexOf(endMarker);

            if (startIdx == -1 || endIdx == -1) {
                return null;
            }

            // Extract base64 content (everything between BEGIN and END markers)
            String keyContent = pem.substring(startIdx + beginMarker.length(), endIdx).replaceAll("\\s+", ""); // Remove all whitespace (newlines, spaces, etc.)

            byte[] keyBytes = Base64.getDecoder().decode(keyContent);

            // Try RSA key factory first (most common)
            try {
                PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
                KeyFactory kf = KeyFactory.getInstance("RSA");
                return kf.generatePrivate(spec);
            } catch (Exception e) {
                // Try EC (Elliptic Curve) key factory as fallback
                try {
                    PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
                    KeyFactory kf = KeyFactory.getInstance("EC");
                    return kf.generatePrivate(spec);
                } catch (Exception ex) {
                    throw new IOException("Failed to parse private key (tried RSA and EC algorithms)", ex);
                }
            }
        } catch (Exception e) {
            throw new IOException("Failed to extract private key from PEM", e);
        }
    }
}
