import { ref, watch, onUnmounted, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchRegisteredClients } from '@/services/security-server.service';
import type { SubsystemId, ServiceInfo } from '@/types';

export interface UseServiceDiscoveryOptions {
  debounceMs?: number;
}

export function useServiceDiscovery(options: UseServiceDiscoveryOptions = {}) {
  const { debounceMs = 500 } = options;
  const { t } = useI18n();

  // Subsystem suggestions from security server
  const subsystemSuggestions = ref<SubsystemId[]>([]);
  const isLoadingSuggestions = ref(false);
  const suggestionsError = ref<string | null>(null);

  // Available services for selected provider
  const availableServices = ref<ServiceInfo[]>([]);

  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function loadSubsystemSuggestions(url: string): Promise<void> {
    if (!url) {
      subsystemSuggestions.value = [];
      suggestionsError.value = null;
      return;
    }

    // Validate URL format before making request
    try {
      new URL(url);
    } catch {
      subsystemSuggestions.value = [];
      return;
    }

    isLoadingSuggestions.value = true;
    suggestionsError.value = null;

    try {
      subsystemSuggestions.value = await fetchRegisteredClients(url);
    } catch (error) {
      console.error('Failed to fetch subsystem suggestions:', error);
      suggestionsError.value = t('xroad.client.fetchError');
      subsystemSuggestions.value = [];
    } finally {
      isLoadingSuggestions.value = false;
    }
  }

  function loadSubsystemSuggestionsDebounced(url: string): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      loadSubsystemSuggestions(url);
    }, debounceMs);
  }

  function clearSuggestions(): void {
    subsystemSuggestions.value = [];
    suggestionsError.value = null;
  }

  function setAvailableServices(services: ServiceInfo[]): void {
    availableServices.value = services;
  }

  function clearAvailableServices(): void {
    availableServices.value = [];
  }

  // Cleanup on unmount (only if in component context)
  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    });
  }

  /**
   * Creates a watcher for security server URL changes
   * Call this in the component setup with the URL ref/reactive property
   */
  function watchSecurityServerUrl(urlGetter: () => string): void {
    watch(
      urlGetter,
      (newUrl) => {
        loadSubsystemSuggestionsDebounced(newUrl);
      },
      { immediate: true }
    );
  }

  return {
    // State
    subsystemSuggestions,
    isLoadingSuggestions,
    suggestionsError,
    availableServices,

    // Actions
    loadSubsystemSuggestions,
    loadSubsystemSuggestionsDebounced,
    clearSuggestions,
    setAvailableServices,
    clearAvailableServices,
    watchSecurityServerUrl,
  };
}
