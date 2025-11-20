import { SubsystemId } from './subsystem-id.model';

export interface ServiceId {
  subsystem: SubsystemId;
  serviceCode: string; // e.g., "getInfo"
  serviceVersion?: string; // e.g., "v1", "1.2.3"
}
