import { ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Ref } from 'vue';
import type { XRoadRequest, SubsystemId } from '@/types';

interface UseCurlImportOptions {
  /**
   * Reactive snapshot of the form's current data. Used by formHasData()
   * to decide whether importing would overwrite user input.
   */
  formData: Ref<Partial<XRoadRequest>>;
  /**
   * Sink the parsed request lands in. Setting this triggers the form's
   * initialRequest watcher, which re-populates the fields.
   */
  currentRequest: Ref<XRoadRequest | null>;
  /** Reset response viewer when applying a fresh import. */
  response: Ref<unknown>;
  /** Clears the "loaded from history" indicator on a non-history import. */
  isFromHistory: Ref<boolean>;
  /** Show a primary-channel success toast. */
  onSuccess: (message: string) => void;
  /** Surface non-fatal parser warnings (e.g., mTLS placeholders). */
  onWarning: (message: string) => void;
}

/**
 * Encapsulates the cURL-import user flow:
 *  - Opening the import dialog.
 *  - Detecting whether the form already has data → asking for confirmation.
 *  - Applying the parsed request to the form (with a null→nextTick→value
 *    cycle that forces the initialRequest watcher to re-fire on identical
 *    consecutive imports).
 */
export function useCurlImport(opts: UseCurlImportOptions) {
  const { t } = useI18n();

  const importOpen = ref(false);
  const replaceConfirmOpen = ref(false);
  const pendingImport = ref<{ request: XRoadRequest; warnings: string[] } | null>(null);

  function open(): void {
    importOpen.value = true;
  }

  // True if the form has user-entered data we'd overwrite on import.
  function formHasData(): boolean {
    const d = opts.formData.value;
    const hasSubsystem = (s: Partial<SubsystemId> | undefined): boolean =>
      !!(s?.instanceId || s?.memberClass || s?.memberCode || s?.subsystemCode);
    return !!(
      d.client?.securityServerUrl ||
      hasSubsystem(d.client?.subsystem) ||
      hasSubsystem(d.service?.subsystem) ||
      d.service?.serviceCode ||
      d.service?.serviceVersion ||
      d.request?.body ||
      (d.request?.path && d.request.path !== '/') ||
      (d.request?.headers && Object.keys(d.request.headers).length > 0) ||
      (d.request?.queryParams && Object.keys(d.request.queryParams).length > 0)
    );
  }

  async function applyImportedRequest(imported: XRoadRequest, warnings: string[]): Promise<void> {
    opts.currentRequest.value = null;
    opts.response.value = null;
    opts.isFromHistory.value = false;
    await nextTick();
    opts.currentRequest.value = imported;
    opts.onSuccess(t('xroad.curlImport.success'));
    if (warnings.length > 0) {
      opts.onWarning(warnings.join(' • '));
    }
  }

  function handleImport(payload: { request: XRoadRequest; warnings: string[] }): void {
    if (formHasData()) {
      pendingImport.value = payload;
      replaceConfirmOpen.value = true;
      return;
    }
    void applyImportedRequest(payload.request, payload.warnings);
  }

  async function confirmReplaceAndApply(): Promise<void> {
    const pending = pendingImport.value;
    pendingImport.value = null;
    if (!pending) return;
    await applyImportedRequest(pending.request, pending.warnings);
  }

  function cancelReplace(): void {
    pendingImport.value = null;
  }

  return {
    importOpen,
    replaceConfirmOpen,
    open,
    handleImport,
    confirmReplaceAndApply,
    cancelReplace,
  };
}
