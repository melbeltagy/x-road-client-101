export interface XRoadError {
  type: string; // e.g., "Client.InvalidRequest", "Server.ServerProxy.NetworkError"
  message: string;
  detail?: string;
  faultCode?: string;
  faultString?: string;
}
