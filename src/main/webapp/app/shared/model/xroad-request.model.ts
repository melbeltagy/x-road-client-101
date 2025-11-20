import { Client } from './client.model';
import { ServiceId } from './service-id.model';
import { RequestDetails } from './request-details.model';

export interface XRoadRequest {
  client: Client;
  service: ServiceId;
  request: RequestDetails;
}
