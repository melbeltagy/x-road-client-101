import { SubsystemId } from './subsystem-id.model';
import { MTlsCertificates } from './mtls-certificates.model';

export interface Client {
  subsystem: SubsystemId;
  securityServerUrl: string; // http or https protocol only
  mtlsCertificates?: MTlsCertificates; // Optional mTLS certificates for Security Server connection
}
