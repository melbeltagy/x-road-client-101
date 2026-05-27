/**
 * Map an HTTP status code to a Vuetify color name. Used by status-chip
 * surfaces (response viewer, history entry).
 *
 * - 0 → error (treated as a client-side / network failure sentinel)
 * - 2xx → success
 * - 3xx → info
 * - 4xx → warning
 * - 5xx (and everything else) → error
 */
export function statusColorFor(statusCode: number): string {
  if (statusCode === 0) return "error";
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 300 && statusCode < 400) return "info";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  return "error";
}
