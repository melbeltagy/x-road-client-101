import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { XRoadRequest, XRoadResponse } from '@/types';
import { useConfigStore } from './config';

export interface RequestHistoryEntry {
  id: string;
  timestamp: string;
  request: XRoadRequest;
  response: XRoadResponse | null;
}

export type HistoryErrorOp = 'save' | 'load' | 'delete' | 'clear';

export interface HistoryError {
  op: HistoryErrorOp;
  message: string;
}

// Module-level sink for storage errors. The persist plugin's storage
// adapter is constructed before the store is instantiated, and writes
// are dispatched from a pinia subscription, so neither side has direct
// access to the store ref. Both sides read/write this sink instead.
let storageErrorSink: HistoryError | null = null;

// Defensive localStorage wrapper. Without this, QuotaExceededError or
// Safari private-mode write rejections bubble up uncaught through the
// persist plugin's subscription and break the main request flow.
const safeStorage: Storage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      storageErrorSink = { op: 'load', message: err instanceof Error ? err.message : String(err) };
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      storageErrorSink = { op: 'save', message: err instanceof Error ? err.message : String(err) };
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      storageErrorSink = { op: 'delete', message: err instanceof Error ? err.message : String(err) };
    }
  },
  clear(): void {
    try {
      localStorage.clear();
    } catch (err) {
      storageErrorSink = { op: 'clear', message: err instanceof Error ? err.message : String(err) };
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

export const useXRoadHistoryStore = defineStore(
  'xroad-history',
  () => {
    const entries = ref<RequestHistoryEntry[]>([]);
    const selectedEntryId = ref<string | null>(null);
    const sidebarOpen = ref(false);
    const lastError = ref<HistoryError | null>(null);

    const selectedEntry = computed(() =>
      Array.isArray(entries.value) ? entries.value.find((e) => e.id === selectedEntryId.value) : undefined
    );

    const mostRecentEntry = computed(() =>
      Array.isArray(entries.value) && entries.value.length > 0 ? entries.value[0] : null
    );

    function generateId(): string {
      return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    function sanitizeRequest(request: XRoadRequest): XRoadRequest {
      // Remove certificates from request for security - never persist private keys
      return {
        ...request,
        client: {
          ...request.client,
          mtlsCertificates: undefined,
        },
      };
    }

    function recordError(op: HistoryErrorOp, err: unknown): void {
      const message = err instanceof Error ? err.message : String(err);
      lastError.value = { op, message };
      console.warn(`[xroad-history] ${op} failed:`, err);
    }

    // Drain any storage errors raised by the persist subscription since
    // the last call. Returns the drained error so callers can react.
    function drainStorageError(): HistoryError | null {
      if (storageErrorSink) {
        const err = storageErrorSink;
        storageErrorSink = null;
        lastError.value = err;
        console.warn(`[xroad-history] storage ${err.op} failed:`, err.message);
        return err;
      }
      return null;
    }

    function clearError(): void {
      lastError.value = null;
    }

    function addRequestToHistory(request: XRoadRequest, response: XRoadResponse): boolean {
      try {
        const sanitizedRequest = sanitizeRequest(request);

        const entry: RequestHistoryEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          request: sanitizedRequest,
          response,
        };

        const configStore = useConfigStore();
        const current = Array.isArray(entries.value) ? entries.value : [];
        entries.value = [entry, ...current].slice(0, configStore.maxHistoryEntries);
        selectedEntryId.value = entry.id;
        // Persist plugin subscription fires synchronously after the
        // mutation above; surface any storage error it raised.
        return drainStorageError() === null;
      } catch (err) {
        recordError('save', err);
        return false;
      }
    }

    function selectHistoryEntry(entryId: string | null): void {
      selectedEntryId.value = entryId;
    }

    function deleteHistoryEntry(entryId: string): boolean {
      try {
        const current = Array.isArray(entries.value) ? entries.value : [];
        entries.value = current.filter((e) => e.id !== entryId);
        if (selectedEntryId.value === entryId) {
          selectedEntryId.value = entries.value.length > 0 ? entries.value[0].id : null;
        }
        return drainStorageError() === null;
      } catch (err) {
        recordError('delete', err);
        return false;
      }
    }

    function clearHistory(): boolean {
      try {
        entries.value = [];
        selectedEntryId.value = null;
        return drainStorageError() === null;
      } catch (err) {
        recordError('clear', err);
        return false;
      }
    }

    function toggleHistorySidebar(): void {
      sidebarOpen.value = !sidebarOpen.value;
    }

    function openHistorySidebar(): void {
      sidebarOpen.value = true;
    }

    function closeHistorySidebar(): void {
      sidebarOpen.value = false;
    }

    return {
      entries,
      selectedEntryId,
      sidebarOpen,
      lastError,
      selectedEntry,
      mostRecentEntry,
      addRequestToHistory,
      selectHistoryEntry,
      deleteHistoryEntry,
      clearHistory,
      drainStorageError,
      clearError,
      toggleHistorySidebar,
      openHistorySidebar,
      closeHistorySidebar,
    };
  },
  {
    persist: {
      key: 'xroad-request-history',
      storage: safeStorage,
      pick: ['entries'],
      afterHydrate: (ctx) => {
        if (!Array.isArray(ctx.store.entries)) {
          ctx.store.entries = [];
        }
        if (storageErrorSink) {
          ctx.store.lastError = storageErrorSink;
          storageErrorSink = null;
        }
      },
    },
  }
);
