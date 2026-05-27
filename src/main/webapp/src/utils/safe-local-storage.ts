/**
 * Defensive localStorage wrapper. Without this, QuotaExceededError or
 * Safari private-mode write rejections bubble up uncaught through the
 * pinia-persist plugin's subscription and can break unrelated flows.
 *
 * Failures are captured into a module-level sink (rather than thrown)
 * because the persist plugin builds its storage adapter before any
 * store is instantiated and dispatches writes from subscriptions, so
 * neither side has direct access to a store ref. Consumers call
 * `drainStorageError()` after a mutation to surface any failure.
 */

export type StorageErrorOp = "save" | "load" | "delete" | "clear";

export interface StorageError {
  op: StorageErrorOp;
  message: string;
}

let storageErrorSink: StorageError | null = null;

function recordSinkError(op: StorageErrorOp, err: unknown): void {
  storageErrorSink = { op, message: err instanceof Error ? err.message : String(err) };
}

export const safeLocalStorage: Storage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      recordSinkError("load", err);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      recordSinkError("save", err);
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      recordSinkError("delete", err);
    }
  },
  clear(): void {
    try {
      localStorage.clear();
    } catch (err) {
      recordSinkError("clear", err);
    }
  },
  key(index: number): string | null {
    try {
      return localStorage.key(index);
    } catch {
      return null;
    }
  },
  get length(): number {
    try {
      return localStorage.length;
    } catch {
      return 0;
    }
  },
};

/** Take the pending storage error (if any) and clear the sink. */
export function drainStorageError(): StorageError | null {
  const err = storageErrorSink;
  storageErrorSink = null;
  return err;
}

/** Look at the pending storage error without clearing it. */
export function peekStorageError(): StorageError | null {
  return storageErrorSink;
}
