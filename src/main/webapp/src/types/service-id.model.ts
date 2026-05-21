import type { SubsystemId } from './subsystem-id.model';

export interface ServiceId {
  subsystem: SubsystemId;
  serviceCode: string;
  serviceVersion?: string;
}
