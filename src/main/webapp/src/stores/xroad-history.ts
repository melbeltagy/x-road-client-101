import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { XRoadRequest, XRoadResponse } from "@/types";
import { useConfigStore } from "./config";
import { safeLocalStorage, drainStorageError, peekStorageError, type StorageErrorOp, type StorageError } from "@/utils/safe-local-storage";

export interface RequestHistoryEntry {
  id: string;
  timestamp: string;
  request: XRoadRequest;
  response: XRoadResponse | null;
}

export type HistoryErrorOp = StorageErrorOp;
export type HistoryError = StorageError;

export const useXRoadHistoryStore = defineStore(
  "xroad-history",
  () => {
    const entries = ref<RequestHistoryEntry[]>([]);
    const selectedEntryId = ref<string | null>(null);
    const sidebarOpen = ref(false);
    const lastError = ref<HistoryError | null>(null);

    const selectedEntry = computed(() =>
      Array.isArray(entries.value) ? entries.value.find((e) => e.id === selectedEntryId.value) : undefined,
    );

    const mostRecentEntry = computed(() => (Array.isArray(entries.value) && entries.value.length > 0 ? entries.value[0] : null));

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

    function clearError(): void {
      lastError.value = null;
    }

    // Run a store mutation that may interact with localStorage via the
    // pinia-persist subscription. Returns true on success, false if the
    // mutation threw or if the persist write surfaced a storage error
    // (drained from the sink afterwards).
    function withStorageGuard(op: HistoryErrorOp, fn: () => void): boolean {
      try {
        fn();
      } catch (err) {
        recordError(op, err);
        return false;
      }
      const err = drainStorageError();
      if (err) {
        lastError.value = err;
        console.warn(`[xroad-history] storage ${err.op} failed:`, err.message);
        return false;
      }
      return true;
    }

    function addRequestToHistory(request: XRoadRequest, response: XRoadResponse): boolean {
      return withStorageGuard("save", () => {
        const entry: RequestHistoryEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          request: sanitizeRequest(request),
          response,
        };
        const configStore = useConfigStore();
        const current = Array.isArray(entries.value) ? entries.value : [];
        entries.value = [entry, ...current].slice(0, configStore.maxHistoryEntries);
        selectedEntryId.value = entry.id;
      });
    }

    function selectHistoryEntry(entryId: string | null): void {
      selectedEntryId.value = entryId;
    }

    function deleteHistoryEntry(entryId: string): boolean {
      return withStorageGuard("delete", () => {
        const current = Array.isArray(entries.value) ? entries.value : [];
        entries.value = current.filter((e) => e.id !== entryId);
        if (selectedEntryId.value === entryId) {
          selectedEntryId.value = entries.value.length > 0 ? entries.value[0].id : null;
        }
      });
    }

    function clearHistory(): boolean {
      return withStorageGuard("clear", () => {
        entries.value = [];
        selectedEntryId.value = null;
      });
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
      clearError,
      toggleHistorySidebar,
      openHistorySidebar,
      closeHistorySidebar,
    };
  },
  {
    persist: {
      key: "xroad-request-history",
      storage: safeLocalStorage,
      pick: ["entries"],
      afterHydrate: (ctx) => {
        if (!Array.isArray(ctx.store.entries)) {
          ctx.store.entries = [];
        }
        const hydrationErr = peekStorageError();
        if (hydrationErr) {
          ctx.store.lastError = drainStorageError();
        }
      },
    },
  },
);
