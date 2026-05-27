import type { XRoadError } from "./xroad-error.model";

export interface XRoadResponse {
  statusCode: number;
  statusText: string;
  headers?: Record<string, string[]>;
  body?: string;
  contentType?: string;
  contentLength?: number;
  xroadId?: string;
  xroadRequestHash?: string;
  xroadRequestId?: string;
  xroadError?: XRoadError;
  timestamp: string;
}
