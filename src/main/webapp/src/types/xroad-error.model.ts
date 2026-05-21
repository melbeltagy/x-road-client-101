export interface XRoadError {
  type: string;
  message: string;
  detail?: string;
  faultCode?: string;
  faultString?: string;
}
