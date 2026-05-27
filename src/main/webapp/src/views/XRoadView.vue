<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useXRoadHistoryStore, type RequestHistoryEntry } from "@/stores/xroad-history";
import type { XRoadRequest, MTlsCertificates } from "@/types";
import { emptySubsystem } from "@/utils/subsystem";
import { XRoadRequestForm } from "@/components/form";
import { CurlImportDialog } from "@/components/curl-import";
import AppNotifications from "@/components/common/AppNotifications.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import RequestProgressIndicator from "@/components/RequestProgressIndicator.vue";
import { XRoadResponseViewer } from "@/components/response";
import { HistoryList } from "@/components/history";
import RequestActionBar from "@/components/action-bar/RequestActionBar.vue";
import NextStepBreadcrumb from "@/components/NextStepBreadcrumb.vue";
import { useNotifications, useRequestExecutor, useCurlImport, useFormFlow, type StepKey } from "@/composables";

const { t } = useI18n();
const historyStore = useXRoadHistoryStore();

const formRef = ref<InstanceType<typeof XRoadRequestForm> | null>(null);

// View-local state
const currentRequest = ref<XRoadRequest | null>(null);
const isFromHistory = ref(false);
const hasAutoLoaded = ref(false);
const formData = ref<Partial<XRoadRequest>>({});
const formValid = ref(false);
const certificates = ref<MTlsCertificates>({});

// Notifications: primary + history-warning toasts.
const { alert, historyAlert, showAlert, hidePrimaryAlert, showHistoryWarning, flushHistoryError } = useNotifications();

// Request submission: loading state, response, lastRequestSuccess, submit().
const { loading, response, lastRequestSuccess, submit } = useRequestExecutor({
  onAlert: showAlert,
  onHistoryWarning: flushHistoryError,
});

// cURL import: dialog state + confirm-before-replace flow.
const {
  importOpen: curlImportOpen,
  replaceConfirmOpen: curlReplaceConfirmOpen,
  open: openCurlImport,
  handleImport: handleCurlImport,
  confirmReplaceAndApply: confirmCurlReplaceAndApply,
  cancelReplace: cancelCurlReplace,
} = useCurlImport({
  formData,
  currentRequest,
  response,
  isFromHistory,
  onSuccess: (msg) => showAlert("success", msg),
  onWarning: (msg) => showHistoryWarning(msg),
});

// Auto-load most recent history entry on mount.
onMounted(() => {
  try {
    if (historyStore.entries.length > 0 && !hasAutoLoaded.value) {
      const mostRecent = historyStore.entries[0];
      currentRequest.value = mostRecent.request;
      response.value = mostRecent.response;
      isFromHistory.value = true;
      historyStore.selectHistoryEntry(mostRecent.id);
      hasAutoLoaded.value = true;
    }
    if (historyStore.lastError) {
      flushHistoryError();
    }
  } catch (err) {
    console.warn("Failed to auto-load most recent history entry:", err);
    showHistoryWarning();
  }
});

// Form submit handler (delegated to the executor composable).
function handleSubmit(data: XRoadRequest): void {
  currentRequest.value = data;
  isFromHistory.value = false;
  void submit(data);
}

// Load a history entry into the form.
function handleHistoryView(entry: RequestHistoryEntry): void {
  currentRequest.value = entry.request;
  response.value = entry.response;
  isFromHistory.value = true;
  hidePrimaryAlert();
  historyStore.selectHistoryEntry(entry.id);
}

// Form change handler — keep the local mirror in sync for the status panel and indicator.
function handleFormChange(data: Partial<XRoadRequest>, valid: boolean, certs: MTlsCertificates): void {
  formData.value = data;
  formValid.value = valid;
  certificates.value = certs;
}

// User modified a request that was loaded from history → drop the indicator.
function handleRequestModified(): void {
  if (isFromHistory.value) {
    isFromHistory.value = false;
    response.value = null;
  }
}

// What is the next required step the user should fill? Used by the
// sticky breadcrumb under the chip row.
const { nextStep } = useFormFlow(() => ({ ...formData.value, certificates: certificates.value }));

function handleNavigate(stepKey: StepKey): void {
  formRef.value?.navigateToStep(stepKey);
}

// formData mirrors the output of useXRoadForm.buildRequest(), so once
// the user has typed enough to fill the client subsystem, formData IS
// the request. The only piece tracked separately is `certificates`,
// which we merge in here so Export cURL can include the mTLS placeholders.
const currentRequestForPanel = computed<XRoadRequest | null>(() => {
  if (!formData.value.client?.subsystem?.instanceId) return null;
  const base = formData.value as XRoadRequest;
  if (Object.keys(certificates.value).length === 0) return base;
  return { ...base, client: { ...base.client, mtlsCertificates: certificates.value } };
});
</script>

<template>
  <v-container fluid class="pb-16">
    <AppNotifications
      :alert="alert"
      :history-alert="historyAlert"
      @update:alert-show="alert.show = $event"
      @update:history-alert-show="historyAlert.show = $event"
    />

    <!-- History indicator -->
    <v-alert v-if="isFromHistory" type="info" variant="tonal" closable class="mb-4" @click:close="isFromHistory = false">
      <v-icon start>history</v-icon>
      {{ t("xroad.history.indicator") }}
    </v-alert>

    <!-- Main content -->
    <v-row>
      <v-col cols="12" lg="6">
        <RequestProgressIndicator :form-data="formData" :certificates="certificates" class="mb-3" @navigate="handleNavigate" />
        <NextStepBreadcrumb :next-step-key="nextStep" @navigate="handleNavigate" />
        <XRoadRequestForm
          ref="formRef"
          :initial-request="currentRequest"
          :is-from-history="isFromHistory"
          @submit="handleSubmit"
          @form-change="handleFormChange"
          @request-modified="handleRequestModified"
        />
      </v-col>

      <v-col cols="12" lg="6">
        <XRoadResponseViewer :response="response" />
      </v-col>
    </v-row>

    <HistoryList @view="handleHistoryView" @show-alert="showAlert" @history-warning="showHistoryWarning" />

    <RequestActionBar
      :client="formData.client ?? { subsystem: emptySubsystem() }"
      :service="formData.service ?? { subsystem: emptySubsystem(), serviceCode: '' }"
      :request-path="formData.request?.path"
      :certificates="certificates"
      :last-request-success="lastRequestSuccess"
      :loading="loading"
      :is-form-valid="formValid"
      :request="currentRequestForPanel"
      @submit="formRef?.submit()"
      @show-alert="showAlert"
      @request-import="openCurlImport"
    />

    <!-- cURL import dialog + replace-confirmation. -->
    <CurlImportDialog v-model="curlImportOpen" @import="handleCurlImport" />
    <ConfirmDialog
      v-model="curlReplaceConfirmOpen"
      :message="t('xroad.curlImport.confirmReplace')"
      color="warning"
      @confirm="confirmCurlReplaceAndApply"
      @cancel="cancelCurlReplace"
    />
  </v-container>
</template>

<style scoped>
.pb-16 {
  padding-bottom: 160px !important;
}
</style>
