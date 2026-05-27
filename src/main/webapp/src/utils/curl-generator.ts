import type { XRoadRequest } from "@/types";
import { buildServiceUrl, formatXRoadClient } from "./xroad-url";
import { methodAllowsBody } from "./http-methods";
import { shellSingleQuote } from "./shell-quote";

export function generateCurlCommand(request: XRoadRequest): string {
  const { client, service, request: reqDetails } = request;

  // Build URL using shared utility
  let url = buildServiceUrl(client.securityServerUrl, service, reqDetails.path);

  // Add query params
  if (reqDetails.queryParams && Object.keys(reqDetails.queryParams).length > 0) {
    const params = new URLSearchParams(reqDetails.queryParams).toString();
    url += `?${params}`;
  }

  const parts: string[] = ["curl", "-v"];

  // Method
  if (reqDetails.method !== "GET") {
    parts.push(`-X ${reqDetails.method}`);
  }

  // URL
  parts.push(shellSingleQuote(url));

  // X-Road-Client header using shared utility
  parts.push(`-H ${shellSingleQuote(`X-Road-Client: ${formatXRoadClient(client.subsystem)}`)}`);

  // Content-Type header
  if (reqDetails.contentType) {
    parts.push(`-H ${shellSingleQuote(`Content-Type: ${reqDetails.contentType}`)}`);
  }

  // Custom headers
  if (reqDetails.headers) {
    for (const [key, value] of Object.entries(reqDetails.headers)) {
      if (key.toLowerCase() !== "content-type") {
        parts.push(`-H ${shellSingleQuote(`${key}: ${value}`)}`);
      }
    }
  }

  // Body
  if (reqDetails.body && methodAllowsBody(reqDetails.method)) {
    parts.push(`-d ${shellSingleQuote(reqDetails.body)}`);
  }

  // mTLS certificates
  if (client.mtlsCertificates) {
    const { clientCert, clientPrivateKey, securityServerCert } = client.mtlsCertificates;
    if (clientCert) {
      parts.push("--cert <client-cert.pem>");
    }
    if (clientPrivateKey) {
      parts.push("--key <client-key.pem>");
    }
    if (securityServerCert) {
      parts.push("--cacert <server-cert.pem>");
    }
  }

  return parts.join(" \\\n  ");
}
