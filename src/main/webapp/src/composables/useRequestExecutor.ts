import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import xroadProxyService from '@/services/xroad-proxy.service';
import { useXRoadHistoryStore } from '@/stores/xroad-history';
import type { XRoadRequest, XRoadResponse } from '@/types';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface ExecutorCallbacks {
  /** Show a primary-channel toast (request result). */
  onAlert: (type: AlertType, message: string) => void;
  /** Show the secondary "history" warning toast when persistence degrades. */
  onHistoryWarning: () => void;
}

/**
 * Orchestrates a single X-Road request: calls the proxy, captures the
 * response (or maps the error to a response shape), persists it to
 * history, and notifies the caller about which toast to show.
 *
 * State surface (loading/response/lastRequestSuccess) is reactive and
 * meant to be bound directly to UI.
 */
export function useRequestExecutor(callbacks: ExecutorCallbacks) {
  const { t } = useI18n();
  const historyStore = useXRoadHistoryStore();

  const loading = ref(false);
  const response = ref<XRoadResponse | null>(null);

  const lastRequestSuccess = computed(() => {
    if (!response.value) return null;
    return response.value.statusCode >= 200 && response.value.statusCode < 300;
  });

  function saveAndMaybeWarn(data: XRoadRequest, result: XRoadResponse): void {
    const saved = historyStore.addRequestToHistory(data, result);
    if (!saved || historyStore.lastError) {
      callbacks.onHistoryWarning();
    }
  }

  // Translate a thrown axios-like error into an XRoadResponse shape so
  // the response viewer can still render something useful.
  function buildErrorResponse(err: unknown): { response: XRoadResponse; alertMessage: string } {
    const axiosError = err as {
      response?: { data?: unknown; status?: number; statusText?: string };
      message?: string;
    };
    const responseData = axiosError.response?.data;

    if (responseData && typeof responseData === 'object') {
      const fullResponseJson = JSON.stringify(responseData, null, 2);
      let errorMessage = t('xroad.toast.unknownError');
      const respData = responseData as Record<string, unknown>;
      if ('body' in respData) {
        errorMessage = String(respData.body || respData.statusText || errorMessage);
      } else if ('detail' in respData) {
        errorMessage = String(respData.detail || respData.message || errorMessage);
      } else if ('message' in respData) {
        errorMessage = String(respData.message);
      }
      return {
        alertMessage: `${t('xroad.toast.error')}: ${errorMessage}`,
        response: {
          statusCode: axiosError.response?.status || 0,
          statusText: axiosError.response?.statusText || t('xroad.toast.clientError'),
          headers: {},
          body: fullResponseJson,
          contentType: 'application/json',
          contentLength: undefined,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const errorMessage = axiosError.message || t('xroad.toast.unknownError');
    return {
      alertMessage: `${t('xroad.toast.error')}: ${errorMessage}`,
      response: {
        statusCode: 0,
        statusText: t('xroad.toast.clientError'),
        headers: {},
        body: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }

  function alertForResult(result: XRoadResponse): { type: AlertType; message: string } {
    if (result.statusCode === 0) {
      return { type: 'error', message: `${t('xroad.toast.requestFailed')}: ${result.body}` };
    }
    if (result.statusCode >= 200 && result.statusCode < 300) {
      return { type: 'success', message: `${t('xroad.toast.requestSuccessful')} (${result.statusCode})` };
    }
    if (result.xroadError) {
      return { type: 'error', message: `${t('xroad.toast.xroadError')}: ${result.xroadError.message}` };
    }
    return {
      type: 'warning',
      message: `${t('xroad.toast.response')}: ${result.statusCode} ${result.statusText}`,
    };
  }

  async function submit(data: XRoadRequest): Promise<void> {
    loading.value = true;
    response.value = null;

    try {
      const result = await xroadProxyService.executeRequest(data);
      response.value = result;
      saveAndMaybeWarn(data, result);
      const { type, message } = alertForResult(result);
      callbacks.onAlert(type, message);
    } catch (err) {
      console.error('X-Road request error:', err);
      const { response: errResponse, alertMessage } = buildErrorResponse(err);
      response.value = errResponse;
      callbacks.onAlert('error', alertMessage);
      saveAndMaybeWarn(data, errResponse);
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    response,
    lastRequestSuccess,
    submit,
  };
}
