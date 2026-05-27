import { computed } from "vue";
import type { SubsystemId, MTlsCertificates } from "@/types";
import { isSubsystemFilled } from "@/utils/subsystem";

/**
 * Shape consumed by useFormCompleteness. Each field is optional so the
 * composable can serve callers that only carry a subset of the form
 * (e.g., the status panel doesn't track method/headers).
 */
export interface FormCompletenessInput {
  client?: {
    subsystem?: Partial<SubsystemId>;
    securityServerUrl?: string;
  };
  service?: {
    subsystem?: Partial<SubsystemId>;
    serviceCode?: string;
    serviceVersion?: string;
  };
  request?: {
    method?: string;
    path?: string;
    queryParams?: Record<string, string>;
    headers?: Record<string, string>;
  };
  certificates?: MTlsCertificates;
}

/**
 * Atomic "is this part of the form filled in?" booleans, derived from a
 * single FormCompletenessInput getter. Consumers compose these into
 * whatever "ready to X" check they need; the composable does not
 * prescribe combinations.
 */
export function useFormCompleteness(input: () => FormCompletenessInput) {
  const securityServerComplete = computed(() => !!input().client?.securityServerUrl?.trim());
  const clientComplete = computed(() => isSubsystemFilled(input().client?.subsystem));
  const serviceSubsystemComplete = computed(() => isSubsystemFilled(input().service?.subsystem));
  const serviceCodeComplete = computed(() => !!input().service?.serviceCode);
  const pathComplete = computed(() => !!input().request?.path);
  const endpointComplete = computed(() => {
    const r = input().request;
    return !!(r?.method && r?.path);
  });
  const queryParametersComplete = computed(() => {
    const q = input().request?.queryParams;
    return !!(q && Object.keys(q).length > 0);
  });
  const customHeadersComplete = computed(() => {
    const h = input().request?.headers;
    return !!(h && Object.keys(h).length > 0);
  });
  const certificatesComplete = computed(() => {
    const c = input().certificates;
    return !!(c?.clientCert || c?.clientPrivateKey || c?.securityServerCert);
  });

  return {
    securityServerComplete,
    clientComplete,
    serviceSubsystemComplete,
    serviceCodeComplete,
    pathComplete,
    endpointComplete,
    queryParametersComplete,
    customHeadersComplete,
    certificatesComplete,
  };
}
