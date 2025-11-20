/**
 * mTLS certificates for X-Road Security Server connection.
 * Contains separate fields for each certificate type.
 */
export interface MTlsCertificates {
  securityServerCert?: string; // Security Server's public certificate (for verification)
  clientCert?: string; // Client's public certificate
  clientPrivateKey?: string; // Client's private key
}

/**
 * Certificate type enum for UI display
 */
export enum CertificateType {
  SECURITY_SERVER = 'securityServerCert',
  CLIENT_CERT = 'clientCert',
  CLIENT_KEY = 'clientPrivateKey',
}

/**
 * Certificate metadata for UI display
 */
export interface CertificateMetadata {
  type: CertificateType;
  label: string;
  description: string;
  required: boolean;
}
