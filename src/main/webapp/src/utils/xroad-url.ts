import type { SubsystemId, ServiceId } from '@/types';

/**
 * Formats a subsystem identifier as X-Road-Client header value
 * Format: {instanceId}/{memberClass}/{memberCode}/{subsystemCode}
 */
export function formatXRoadClient(subsystem: SubsystemId): string {
  return `${subsystem.instanceId}/${subsystem.memberClass}/${subsystem.memberCode}/${subsystem.subsystemCode}`;
}

/**
 * Builds the X-Road REST service path
 * Format: /r1/{instanceId}/{memberClass}/{memberCode}/{subsystemCode}/{serviceCode}[/{serviceVersion}]
 */
export function buildServicePath(service: ServiceId, path: string): string {
  const { subsystem, serviceCode, serviceVersion } = service;

  let servicePath = `/r1/${subsystem.instanceId}/${subsystem.memberClass}/${subsystem.memberCode}/${subsystem.subsystemCode}/${serviceCode}`;

  if (serviceVersion) {
    servicePath += `/${serviceVersion}`;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  servicePath += normalizedPath;

  return servicePath;
}

/**
 * Builds the full X-Road service URL
 * Combines security server URL with service path
 */
export function buildServiceUrl(securityServerUrl: string, service: ServiceId, path: string): string {
  // Remove trailing slashes from base URL
  const baseUrl = securityServerUrl.replace(/\/+$/, '');
  const servicePath = buildServicePath(service, path);
  return `${baseUrl}${servicePath}`;
}

/**
 * Builds service URL from individual components (for cases where ServiceId is not available)
 */
export function buildServiceUrlFromParts(
  securityServerUrl: string,
  instanceId: string,
  memberClass: string,
  memberCode: string,
  subsystemCode: string,
  serviceCode: string,
  serviceVersion: string | undefined,
  path: string
): string {
  const service: ServiceId = {
    subsystem: { instanceId, memberClass, memberCode, subsystemCode },
    serviceCode,
    serviceVersion,
  };
  return buildServiceUrl(securityServerUrl, service, path);
}
