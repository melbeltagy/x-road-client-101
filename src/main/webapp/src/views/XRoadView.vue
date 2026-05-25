<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useXRoadHistoryStore, type RequestHistoryEntry } from '@/stores/xroad-history';
import type { XRoadRequest, MTlsCertificates, SubsystemId, RequestDetails } from '@/types';
import { XRoadRequestForm, CurlImportFlow } from '@/components/xroad/form';
import AppNotifications from '@/components/common/AppNotifications.vue';
import RequestProgressIndicator from '@/components/xroad/RequestProgressIndicator.vue';
import { XRoadResponseViewer } from '@/components/xroad/response';
import { HistoryList, RequestStatusPanel } from '@/components/xroad/history';
import { useNotifications } from '@/composables/useNotifications';
import { useRequestExecutor } from '@/composables/useRequestExecutor';
import { useCurlImport } from '@/composables/useCurlImport';

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
const { alert, historyAlert, showAlert, hidePrimaryAlert, showHistoryWarning, flushHistoryError } =
  useNotifications();

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
  onSuccess: (msg) => showAlert('success', msg),
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
    console.warn('Failed to auto-load most recent history entry:', err);
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

// Build the request payload for the status panel from current form state.
function buildCurrentRequest(): XRoadRequest | null {
  if (!formData.value.client?.subsystem?.instanceId) return null;
  return {
    client: {
      subsystem: formData.value.client.subsystem as SubsystemId,
      securityServerUrl: formData.value.client.securityServerUrl || '',
      mtlsCertificates: Object.keys(certificates.value).length > 0 ? certificates.value : undefined,
    },
    service: {
      subsystem: formData.value.service?.subsystem as SubsystemId,
      serviceCode: formData.value.service?.serviceCode || '',
      serviceVersion: formData.value.service?.serviceVersion,
    },
    request: {
      method: (formData.value.request?.method as RequestDetails['method']) || 'GET',
      path: formData.value.request?.path || '/',
      queryParams: formData.value.request?.queryParams,
      headers: formData.value.request?.headers,
      body: formData.value.request?.body,
      contentType: formData.value.request?.contentType,
    },
  };
}
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
    <v-alert
      v-if="isFromHistory"
      type="info"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="isFromHistory = false"
    >
      <v-icon start>history</v-icon>
      {{ t('xroad.history.indicator') }}
    </v-alert>

    <!-- Main content -->
    <v-row>
      <v-col cols="12" lg="6">
        <RequestProgressIndicator
          :form-data="formData"
          :certificates="certificates"
          class="mb-3"
          @navigate="(stepKey) => formRef?.navigateToStep(stepKey)"
        />
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

    <HistoryList
      @view="handleHistoryView"
      @show-alert="showAlert"
      @history-warning="showHistoryWarning"
    />

    <RequestStatusPanel
      :client="{
        subsystem: {
          instanceId: formData.client?.subsystem?.instanceId,
          memberClass: formData.client?.subsystem?.memberClass,
          memberCode: formData.client?.subsystem?.memberCode,
          subsystemCode: formData.client?.subsystem?.subsystemCode,
        },
        securityServerUrl: formData.client?.securityServerUrl,
      }"
      :service="{
        subsystem: {
          instanceId: formData.service?.subsystem?.instanceId,
          memberClass: formData.service?.subsystem?.memberClass,
          memberCode: formData.service?.subsystem?.memberCode,
          subsystemCode: formData.service?.subsystem?.subsystemCode,
        },
        serviceCode: formData.service?.serviceCode,
        serviceVersion: formData.service?.serviceVersion,
      }"
      :request-path="formData.request?.path"
      :certificates="certificates"
      :last-request-success="lastRequestSuccess"
      :loading="loading"
      :is-form-valid="formValid"
      :request="buildCurrentRequest()"
      @submit="formRef?.submit()"
      @show-alert="showAlert"
      @request-import="openCurlImport"
    />

    <CurlImportFlow
      :import-open="curlImportOpen"
      :replace-confirm-open="curlReplaceConfirmOpen"
      @update:import-open="curlImportOpen = $event"
      @update:replace-confirm-open="curlReplaceConfirmOpen = $event"
      @import="handleCurlImport"
      @confirm-replace="confirmCurlReplaceAndApply"
      @cancel-replace="cancelCurlReplace"
    />
  </v-container>
</template>

<style scoped>
.pb-16 {
  padding-bottom: 160px !important;
}
</style>
