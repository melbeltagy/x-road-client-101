import type { XRoadRequest } from '@/types';
import { buildServiceUrl, formatXRoadClient } from './xroad-url';

export function generateCurlCommand(request: XRoadRequest): string {
  const { client, service, request: reqDetails } = request;

  // Build URL using shared utility
  let url = buildServiceUrl(client.securityServerUrl, service, reqDetails.path);

  // Add query params
  if (reqDetails.queryParams && Object.keys(reqDetails.queryParams).length > 0) {
    const params = new URLSearchParams(reqDetails.queryParams).toString();
    url += `?${params}`;
  }

  const parts: string[] = ['curl', '-v'];

  // Method
  if (reqDetails.method !== 'GET') {
    parts.push(`-X ${reqDetails.method}`);
  }

  // URL (quoted)
  parts.push(`'${url}'`);

  // X-Road-Client header using shared utility
  parts.push(`-H 'X-Road-Client: ${formatXRoadClient(client.subsystem)}'`);

  // Content-Type header
  if (reqDetails.contentType) {
    parts.push(`-H 'Content-Type: ${reqDetails.contentType}'`);
  }

  // Custom headers
  if (reqDetails.headers) {
    for (const [key, value] of Object.entries(reqDetails.headers)) {
      if (key.toLowerCase() !== 'content-type') {
        parts.push(`-H '${key}: ${value}'`);
      }
    }
  }

  // Body
  if (reqDetails.body && ['POST', 'PUT', 'PATCH'].includes(reqDetails.method)) {
    const escapedBody = reqDetails.body.replace(/'/g, "'\\''");
    parts.push(`-d '${escapedBody}'`);
  }

  // mTLS certificates
  if (client.mtlsCertificates) {
    const { clientCert, clientPrivateKey, securityServerCert } = client.mtlsCertificates;
    if (clientCert) {
      parts.push('--cert <client-cert.pem>');
    }
    if (clientPrivateKey) {
      parts.push('--key <client-key.pem>');
    }
    if (securityServerCert) {
      parts.push('--cacert <server-cert.pem>');
    }
  }

  return parts.join(' \\\n  ');
}
