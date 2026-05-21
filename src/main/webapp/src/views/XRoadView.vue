<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useXRoadHistoryStore, type RequestHistoryEntry } from '@/stores/xroad-history';
import xroadProxyService from '@/services/xroad-proxy.service';
import type { XRoadRequest, XRoadResponse, MTlsCertificates } from '@/types';
import { XRoadRequestForm } from '@/components/xroad/form';
import { XRoadResponseViewer } from '@/components/xroad/response';
import { HistoryList, RequestStatusPanel } from '@/components/xroad/history';

const { t } = useI18n();
const historyStore = useXRoadHistoryStore();

// Request form ref
const formRef = ref<InstanceType<typeof XRoadRequestForm> | null>(null);

// State
const loading = ref(false);
const response = ref<XRoadResponse | null>(null);
const currentRequest = ref<XRoadRequest | null>(null);
const isFromHistory = ref(false);
const hasAutoLoaded = ref(false);

// Form state for status panel
const formData = ref<Partial<XRoadRequest>>({});
const formValid = ref(false);
const certificates = ref<MTlsCertificates>({});

// Alert state
const alert = ref<{
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}>({
  show: false,
  type: 'success',
  message: '',
});

// Show alert helper
function showAlert(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
  alert.value = { show: true, type, message };
}

// Auto-load most recent request on page load
onMounted(() => {
  if (historyStore.entries.length > 0 && !hasAutoLoaded.value) {
    const mostRecent = historyStore.entries[0];
    currentRequest.value = mostRecent.request;
    response.value = mostRecent.response;
    isFromHistory.value = true;
    historyStore.selectHistoryEntry(mostRecent.id);
    hasAutoLoaded.value = true;
  }
});

// Handle form submit
async function handleSubmit(data: XRoadRequest): Promise<void> {
  loading.value = true;
  response.value = null;
  currentRequest.value = data;
  isFromHistory.value = false;

  try {
    const result = await xroadProxyService.executeRequest(data);
    response.value = result;

    historyStore.addRequestToHistory(data, result);

    if (result.statusCode === 0) {
      showAlert('error', `${t('xroad.toast.requestFailed')}: ${result.body}`);
    } else if (result.statusCode >= 200 && result.statusCode < 300) {
      showAlert('success', `${t('xroad.toast.requestSuccessful')} (${result.statusCode})`);
    } else if (result.xroadError) {
      showAlert('error', `${t('xroad.toast.xroadError')}: ${result.xroadError.message}`);
    } else {
      showAlert('warning', `${t('xroad.toast.response')}: ${result.statusCode} ${result.statusText}`);
    }
  } catch (error: unknown) {
    console.error('X-Road request error:', error);

    const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string }; message?: string };
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

      showAlert('error', `${t('xroad.toast.error')}: ${errorMessage}`);

      const errorResponse: XRoadResponse = {
        statusCode: axiosError.response?.status || 0,
        statusText: axiosError.response?.statusText || t('xroad.toast.clientError'),
        headers: {},
        body: fullResponseJson,
        contentType: 'application/json',
        contentLength: undefined,
        timestamp: new Date().toISOString(),
      };

      response.value = errorResponse;
      historyStore.addRequestToHistory(data, errorResponse);
    } else {
      const errorMessage = axiosError.message || t('xroad.toast.unknownError');
      showAlert('error', `${t('xroad.toast.error')}: ${errorMessage}`);

      const errorResponse: XRoadResponse = {
        statusCode: 0,
        statusText: t('xroad.toast.clientError'),
        headers: {},
        body: errorMessage,
        timestamp: new Date().toISOString(),
      };

      response.value = errorResponse;
      historyStore.addRequestToHistory(data, errorResponse);
    }
  } finally {
    loading.value = false;
  }
}

// Handle history view
function handleHistoryView(entry: RequestHistoryEntry): void {
  currentRequest.value = entry.request;
  response.value = entry.response;
  isFromHistory.value = true;
  alert.value.show = false;
  historyStore.selectHistoryEntry(entry.id);
}

// Handle history alert
function handleHistoryAlert(color: 'success' | 'error' | 'warning', message: string): void {
  showAlert(color, message);
}

// Handle request modified
function handleRequestModified(): void {
  if (isFromHistory.value) {
    isFromHistory.value = false;
    response.value = null;
  }
}

// Handle form change
function handleFormChange(data: Partial<XRoadRequest>, valid: boolean, certs: MTlsCertificates): void {
  formData.value = data;
  formValid.value = valid;
  certificates.value = certs;
}

// Handle status panel submit
function handleStatusPanelSubmit(): void {
  formRef.value?.submit();
}

// Computed: last request success status
const lastRequestSuccess = computed(() => {
  if (!response.value) return null;
  return response.value.statusCode >= 200 && response.value.statusCode < 300;
});
</script>

<template>
  <v-container fluid class="pb-16">
    <!-- Alert notifications -->
    <v-snackbar
      v-model="alert.show"
      :color="alert.type"
      :timeout="5000"
      location="top"
    >
      {{ alert.message }}
      <template #actions>
        <v-btn variant="text" @click="alert.show = false">
          <v-icon>close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

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
      <!-- Request Form -->
      <v-col cols="12" lg="6">
        <XRoadRequestForm
          ref="formRef"
          :initial-request="currentRequest"
          :is-from-history="isFromHistory"
          @submit="handleSubmit"
          @form-change="handleFormChange"
          @request-modified="handleRequestModified"
        />
      </v-col>

      <!-- Response Viewer -->
      <v-col cols="12" lg="6">
        <XRoadResponseViewer :response="response" />
      </v-col>
    </v-row>

    <!-- History Sidebar -->
    <HistoryList
      @view="handleHistoryView"
      @show-alert="handleHistoryAlert"
    />

    <!-- Request Status Panel -->
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
      @submit="handleStatusPanelSubmit"
    />
  </v-container>
</template>

<style scoped>
.pb-16 {
  padding-bottom: 160px !important;
}
</style>
