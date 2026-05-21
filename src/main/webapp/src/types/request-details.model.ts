export interface RequestDetails {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
  contentType?: string;
}
