import type { RequestDetails } from '@/types';

export type HttpMethod = RequestDetails['method'];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const satisfies readonly HttpMethod[];

export const BODY_METHODS = ['POST', 'PUT', 'PATCH'] as const satisfies readonly HttpMethod[];

export function methodAllowsBody(method: string): boolean {
  return (BODY_METHODS as readonly string[]).includes(method);
}

// Vuetify color names per HTTP method. Used by method-chip surfaces
// (endpoint picker, history list). Unknown methods fall back to 'secondary'.
export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'success',
  POST: 'primary',
  PUT: 'warning',
  DELETE: 'error',
  PATCH: 'secondary',
};

export function methodColor(method: string | undefined): string {
  if (!method) return 'secondary';
  return METHOD_COLORS[method as HttpMethod] ?? 'secondary';
}
