import type { Client } from './client.model';
import type { ServiceId } from './service-id.model';
import type { RequestDetails } from './request-details.model';

export interface XRoadRequest {
  client: Client;
  service: ServiceId;
  request: RequestDetails;
}
