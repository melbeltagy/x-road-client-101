import type { SubsystemId } from "./subsystem-id.model";
import type { MTlsCertificates } from "./mtls-certificates.model";

export interface Client {
  subsystem: SubsystemId;
  securityServerUrl: string;
  mtlsCertificates?: MTlsCertificates;
}
