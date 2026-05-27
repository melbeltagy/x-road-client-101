import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { fetchRegisteredClients } from "@/services/security-server.service";
import type { SubsystemId } from "@/types";
import { isValidHttpUrl } from "@/utils/xroad-url";
import { useDebounce } from "./useDebounce";

export interface UseSubsystemSuggestionsOptions {
  debounceMs?: number;
}

/**
 * Fetches "registered clients" for a given Security Server URL and
 * exposes them as a reactive list of SubsystemIds, with loading + error
 * state. Used to power the auto-complete suggestions on the Client
 * Identifier and Service Identifier subsystem fields.
 *
 * Fetch is debounced and skipped on malformed URLs so each keystroke
 * in the SS URL field doesn't hammer the backend.
 */
export function useSubsystemSuggestions(options: UseSubsystemSuggestionsOptions = {}) {
  const { debounceMs = 500 } = options;
  const { t } = useI18n();

  const subsystemSuggestions = ref<SubsystemId[]>([]);
  const isLoadingSuggestions = ref(false);
  const suggestionsError = ref<string | null>(null);

  async function loadSubsystemSuggestions(url: string): Promise<void> {
    // Treat empty/malformed/non-HTTP URLs as "nothing to fetch" — clear
    // stale state and bail without hitting the network or leaving a
    // stale "could not fetch" chip behind.
    if (!isValidHttpUrl(url)) {
      subsystemSuggestions.value = [];
      suggestionsError.value = null;
      return;
    }

    isLoadingSuggestions.value = true;
    suggestionsError.value = null;

    try {
      subsystemSuggestions.value = await fetchRegisteredClients(url);
    } catch (error) {
      console.error("Failed to fetch subsystem suggestions:", error);
      suggestionsError.value = t("xroad.client.fetchError");
      subsystemSuggestions.value = [];
    } finally {
      isLoadingSuggestions.value = false;
    }
  }

  const { debounced: loadSubsystemSuggestionsDebounced } = useDebounce((url: string) => {
    void loadSubsystemSuggestions(url);
  }, debounceMs);

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
      { immediate: true },
    );
  }

  return {
    subsystemSuggestions,
    isLoadingSuggestions,
    suggestionsError,
    loadSubsystemSuggestions,
    loadSubsystemSuggestionsDebounced,
    watchSecurityServerUrl,
  };
}
