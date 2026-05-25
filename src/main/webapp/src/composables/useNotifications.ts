import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useXRoadHistoryStore } from '@/stores/xroad-history';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  show: boolean;
  type: AlertType;
  message: string;
}

interface HistoryAlertState {
  show: boolean;
  message: string;
}

/**
 * Owns the two notification channels used by XRoadView:
 *  - Primary `alert`: request results, success/error toasts. Center-top.
 *  - Secondary `historyAlert`: history-persistence warnings. Top-right,
 *    so a save-to-history failure doesn't replace the primary toast.
 */
export function useNotifications() {
  const { t } = useI18n();
  const historyStore = useXRoadHistoryStore();

  const alert = ref<AlertState>({ show: false, type: 'success', message: '' });
  const historyAlert = ref<HistoryAlertState>({ show: false, message: '' });

  function showAlert(type: AlertType, message: string): void {
    alert.value = { show: true, type, message };
  }

  function hidePrimaryAlert(): void {
    alert.value.show = false;
  }

  function showHistoryWarning(message?: string): void {
    historyAlert.value = {
      show: true,
      message: message ?? t('xroad.toast.historyError'),
    };
  }

  /**
   * Drain any deferred history error from the store into the toast.
   * Used after store mutations that may have surfaced a persistence
   * failure asynchronously through the persist plugin's subscription.
   */
  function flushHistoryError(): void {
    showHistoryWarning();
    historyStore.clearError();
  }

  return {
    alert,
    historyAlert,
    showAlert,
    hidePrimaryAlert,
    showHistoryWarning,
    flushHistoryError,
  };
}
