export interface MTlsCertificates {
  securityServerCert?: string;
  clientCert?: string;
  clientPrivateKey?: string;
}

export enum CertificateType {
  SECURITY_SERVER = "securityServerCert",
  CLIENT_CERT = "clientCert",
  CLIENT_KEY = "clientPrivateKey",
}

export interface CertificateMetadata {
  type: CertificateType;
  label: string;
  description: string;
  required: boolean;
}
