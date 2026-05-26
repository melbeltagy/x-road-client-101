/**
 * Loose shape we expect from an axios rejection. We don't import axios's
 * AxiosError type because the executor catches `unknown` and we want to
 * survive non-axios throws (mocked services, transformed errors).
 */
export interface AxiosLikeError {
  response?: {
    data?: unknown;
    status?: number;
    statusText?: string;
  };
  message?: string;
}

export interface CoercedAxiosError {
  status: number | undefined;
  statusText: string | undefined;
  data: unknown;
  message: string | undefined;
}

/** Read the axios-like shape out of an unknown rejection. */
export function coerceAxiosError(err: unknown): CoercedAxiosError {
  const e = err as AxiosLikeError;
  return {
    status: e?.response?.status,
    statusText: e?.response?.statusText,
    data: e?.response?.data,
    message: e?.message,
  };
}

/**
 * Probe an unknown server error payload for a human-readable message.
 * Checks `body`, then `detail`, then `message` — in that order — and
 * returns the fallback for non-objects or unrecognized shapes.
 */
export function pickErrorMessage(responseData: unknown, fallback: string): string {
  if (!responseData || typeof responseData !== 'object') return fallback;
  const data = responseData as Record<string, unknown>;
  if ('body' in data) {
    return String(data.body || data.statusText || fallback);
  }
  if ('detail' in data) {
    return String(data.detail || data.message || fallback);
  }
  if ('message' in data) {
    return String(data.message);
  }
  return fallback;
}
