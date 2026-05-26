import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchServices } from '@/services/security-server.service';
import type { SubsystemId, ServiceInfo } from '@/types';
import { isValidHttpUrl } from '@/utils/xroad-url';
import { isSubsystemFilled } from '@/utils/subsystem';
import { useDebounce } from './useDebounce';

export interface UseServicesLoaderOptions {
  debounceMs?: number;
}

/**
 * Owns the "services available on a given (security server, client, service
 * subsystem) triple" state: reactive `availableServices`, `isLoading`,
 * `error`. Fetches with a trailing-edge debounce on any input change;
 * clears immediately on change so stale results don't linger while the
 * debounce window is open.
 *
 * Inputs are getters so callers can pass refs/reactive properties
 * without unwrapping.
 */
export function useServicesLoader(
  getSecurityServerUrl: () => string | undefined,
  getClientSubsystem: () => Partial<SubsystemId> | undefined,
  getServiceSubsystem: () => Partial<SubsystemId> | undefined,
  options: UseServicesLoaderOptions = {}
) {
  const { debounceMs = 500 } = options;
  const { t } = useI18n();

  const availableServices = ref<ServiceInfo[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function load(): Promise<void> {
    const url = getSecurityServerUrl();
    const client = getClientSubsystem();
    const service = getServiceSubsystem();

    if (!isValidHttpUrl(url) || !isSubsystemFilled(client) || !isSubsystemFilled(service)) {
      availableServices.value = [];
      error.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;
    try {
      availableServices.value = await fetchServices(url!, client as SubsystemId, service as SubsystemId);
    } catch (e) {
      console.error('Failed to fetch services:', e);
      error.value = t('xroad.service.fetchError');
      availableServices.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  const { debounced: debouncedLoad } = useDebounce(() => { void load(); }, debounceMs);

  watch(
    [getSecurityServerUrl, getClientSubsystem, getServiceSubsystem],
    () => {
      // Clear immediately so stale data doesn't show while debounce window is open.
      availableServices.value = [];
      error.value = null;
      debouncedLoad();
    },
    { deep: true }
  );

  return { availableServices, isLoading, error };
}
