import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { XRoadRequest, XRoadResponse } from '@/types';

const DEFAULT_MAX_HISTORY_ENTRIES = 25;
const MAX_HISTORY_ENTRIES = parseInt(import.meta.env.VITE_MAX_HISTORY_ENTRIES || '', 10) || DEFAULT_MAX_HISTORY_ENTRIES;

export interface RequestHistoryEntry {
  id: string;
  timestamp: string;
  request: XRoadRequest;
  response: XRoadResponse | null;
}

export const useXRoadHistoryStore = defineStore(
  'xroad-history',
  () => {
    const entries = ref<RequestHistoryEntry[]>([]);
    const selectedEntryId = ref<string | null>(null);
    const sidebarOpen = ref(false);

    const selectedEntry = computed(() => entries.value.find((e) => e.id === selectedEntryId.value));

    const mostRecentEntry = computed(() => (entries.value.length > 0 ? entries.value[0] : null));

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

    function addRequestToHistory(request: XRoadRequest, response: XRoadResponse): void {
      const sanitizedRequest = sanitizeRequest(request);

      const entry: RequestHistoryEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        request: sanitizedRequest,
        response,
      };

      entries.value = [entry, ...entries.value].slice(0, MAX_HISTORY_ENTRIES);
      selectedEntryId.value = entry.id;
    }

    function selectHistoryEntry(entryId: string | null): void {
      selectedEntryId.value = entryId;
    }

    function deleteHistoryEntry(entryId: string): void {
      entries.value = entries.value.filter((e) => e.id !== entryId);
      if (selectedEntryId.value === entryId) {
        selectedEntryId.value = entries.value.length > 0 ? entries.value[0].id : null;
      }
    }

    function clearHistory(): void {
      entries.value = [];
      selectedEntryId.value = null;
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
      selectedEntry,
      mostRecentEntry,
      addRequestToHistory,
      selectHistoryEntry,
      deleteHistoryEntry,
      clearHistory,
      toggleHistorySidebar,
      openHistorySidebar,
      closeHistorySidebar,
    };
  },
  {
    persist: {
      key: 'xroad-request-history',
      storage: localStorage,
      pick: ['entries'],
    },
  }
);
