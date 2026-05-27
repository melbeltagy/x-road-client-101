import type { SubsystemId } from "./subsystem-id.model";

export interface ServiceId {
  subsystem: SubsystemId;
  serviceCode: string;
  serviceVersion?: string;
}

export interface ServiceEndpoint {
  method: string;
  path: string;
}

export interface ServiceInfo {
  serviceCode: string;
  serviceType: string;
  endpoints: ServiceEndpoint[];
}
