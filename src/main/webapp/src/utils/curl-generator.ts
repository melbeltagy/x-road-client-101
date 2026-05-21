import type { XRoadRequest } from '@/types';

export function generateCurlCommand(request: XRoadRequest): string {
  const { client, service, request: reqDetails } = request;

  // Build URL
  const baseUrl = client.securityServerUrl;
  const servicePath = buildServicePath(service, reqDetails.path);
  let url = `${baseUrl}${servicePath}`;

  // Add query params
  if (reqDetails.queryParams && Object.keys(reqDetails.queryParams).length > 0) {
    const params = new URLSearchParams(reqDetails.queryParams).toString();
    url += `?${params}`;
  }

  const parts: string[] = ['curl'];

  // Method
  if (reqDetails.method !== 'GET') {
    parts.push(`-X ${reqDetails.method}`);
  }

  // URL (quoted)
  parts.push(`'${url}'`);

  // X-Road-Client header
  const clientHeader = `${client.subsystem.instanceId}/${client.subsystem.memberClass}/${client.subsystem.memberCode}/${client.subsystem.subsystemCode}`;
  parts.push(`-H 'X-Road-Client: ${clientHeader}'`);

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

function buildServicePath(service: XRoadRequest['service'], path: string): string {
  const { subsystem, serviceCode, serviceVersion } = service;
  let servicePath = `/r1/${subsystem.instanceId}/${subsystem.memberClass}/${subsystem.memberCode}/${subsystem.subsystemCode}/${serviceCode}`;
  if (serviceVersion) {
    servicePath += `/${serviceVersion}`;
  }
  servicePath += path;
  return servicePath;
}
