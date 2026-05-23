import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchConfig } from '@/services/config.service';

const DEFAULT_MAX_HISTORY_ENTRIES = 15;

export const useConfigStore = defineStore('config', () => {
  const maxHistoryEntries = ref(DEFAULT_MAX_HISTORY_ENTRIES);
  const isLoaded = ref(false);

  async function initializeConfig(): Promise<void> {
    try {
      const config = await fetchConfig();
      maxHistoryEntries.value = config.maxHistoryEntries;
    } catch (error) {
      console.warn('Failed to fetch config, using defaults:', error);
    } finally {
      isLoaded.value = true;
    }
  }

  return {
    maxHistoryEntries,
    isLoaded,
    initializeConfig,
  };
});
