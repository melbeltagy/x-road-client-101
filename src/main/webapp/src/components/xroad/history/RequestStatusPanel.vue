<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MTlsCertificates, XRoadRequest } from '@/types';
import { generateCurlCommand } from '@/utils/curl-generator';
import { buildServiceUrlFromParts } from '@/utils/xroad-url';

const props = defineProps<{
  client: {
    subsystem: {
      instanceId?: string;
      memberClass?: string;
      memberCode?: string;
      subsystemCode?: string;
    };
    securityServerUrl?: string;
  };
  service: {
    subsystem: {
      instanceId?: string;
      memberClass?: string;
      memberCode?: string;
      subsystemCode?: string;
    };
    serviceCode?: string;
    serviceVersion?: string;
  };
  requestPath?: string;
  certificates: MTlsCertificates;
  lastRequestSuccess: boolean | null;
  loading: boolean;
  isFormValid: boolean;
  request: XRoadRequest | null;
}>();

const emit = defineEmits<{
  submit: [];
  showAlert: [type: 'success' | 'error' | 'warning', message: string];
  requestImport: [];
}>();

const { t } = useI18n();

const clientHeader = computed(() => {
  const { instanceId, memberClass, memberCode, subsystemCode } = props.client.subsystem;
  // Show partial client identifier as user types
  const parts = [instanceId, memberClass, memberCode, subsystemCode];
  const hasAnyValue = parts.some(p => p);
  if (!hasAnyValue) {
    return null;
  }
  return parts.map(p => p || '').join('/');
});

const serviceUrl = computed(() => {
  const { securityServerUrl } = props.client;
  const { instanceId, memberClass, memberCode, subsystemCode } = props.service.subsystem;
  const { serviceCode, serviceVersion } = props.service;
  const path = props.requestPath;

  // Show partial URL as user types
  const hasAnyServiceField = instanceId || memberClass || memberCode || subsystemCode || serviceCode;
  if (!securityServerUrl && !hasAnyServiceField && !path) {
    return null;
  }

  // Use shared utility for URL construction
  return buildServiceUrlFromParts(
    securityServerUrl || '',
    instanceId || '',
    memberClass || '',
    memberCode || '',
    subsystemCode || '',
    serviceCode || '',
    serviceVersion || undefined,
    path || ''
  );
});

const hasMtls = computed(() => {
  return !!(
    props.certificates.securityServerCert?.trim() &&
    props.certificates.clientCert?.trim() &&
    props.certificates.clientPrivateKey?.trim()
  );
});

const hasHttpsNoAuth = computed(() => {
  return !!(props.certificates.securityServerCert?.trim());
});

const requestStatusColor = computed(() => {
  if (props.lastRequestSuccess === null) return 'grey';
  return props.lastRequestSuccess ? 'success' : 'error';
});

const requestStatusIcon = computed(() => {
  if (props.lastRequestSuccess === null) return 'radio_button_unchecked';
  return props.lastRequestSuccess ? 'check_circle' : 'cancel';
});

const requestStatusText = computed(() => {
  if (props.lastRequestSuccess === null) return t('xroad.status.notSent');
  return props.lastRequestSuccess ? t('xroad.status.success') : t('xroad.status.error');
});

// Check if client identifier is complete (all 4 fields filled)
const isClientComplete = computed(() => {
  const { instanceId, memberClass, memberCode, subsystemCode } = props.client.subsystem;
  return !!(instanceId && memberClass && memberCode && subsystemCode);
});

// Check if service URL is complete (all required fields filled)
const isServiceComplete = computed(() => {
  const { securityServerUrl } = props.client;
  const { instanceId, memberClass, memberCode, subsystemCode } = props.service.subsystem;
  const { serviceCode } = props.service;
  return !!(securityServerUrl && instanceId && memberClass && memberCode && subsystemCode && serviceCode && props.requestPath);
});

// Copy request as cURL command
async function copyAsCurl(): Promise<void> {
  if (!props.request) return;

  try {
    const curlCommand = generateCurlCommand(props.request);
    await navigator.clipboard.writeText(curlCommand);
    emit('showAlert', 'success', t('xroad.toast.curlCopied'));
  } catch (error) {
    emit('showAlert', 'error', t('xroad.toast.curlCopyFailed'));
  }
}
</script>

<template>
  <v-footer app class="status-panel elevation-4">
    <v-container fluid class="pa-4">
      <!-- Client Header -->
      <v-row class="mb-2">
        <v-col>
          <div class="d-flex align-center">
            <strong class="text-h6 mr-3" style="min-width: 150px;">{{ t('xroad.status.client') }}:</strong>
            <template v-if="clientHeader">
              <v-icon
                v-if="!isClientComplete"
                color="warning"
                size="small"
                class="mr-1"
              >warning</v-icon>
              <span
                class="text-h5 font-monospace"
                :class="{ 'text-warning': !isClientComplete }"
              >{{ clientHeader }}</span>
            </template>
            <span v-else class="text-medium-emphasis">{{ t('xroad.status.notConfigured') }}</span>
          </div>
        </v-col>
      </v-row>

      <!-- Service URL -->
      <v-row class="mb-4">
        <v-col>
          <div class="d-flex align-center">
            <strong class="text-h6 mr-3" style="min-width: 150px;">{{ t('xroad.status.serviceUrl') }}:</strong>
            <template v-if="serviceUrl">
              <v-icon
                v-if="!isServiceComplete"
                color="warning"
                size="small"
                class="mr-1"
              >warning</v-icon>
              <span
                class="text-h5 font-monospace text-break"
                :class="{ 'text-warning': !isServiceComplete }"
              >{{ serviceUrl }}</span>
            </template>
            <span v-else class="text-medium-emphasis">{{ t('xroad.status.notConfigured') }}</span>
          </div>
        </v-col>
      </v-row>

      <!-- Indicators and Send Button -->
      <v-row align="center">
        <!-- mTLS Status -->
        <v-col cols="12" md="2">
          <div class="d-flex align-center">
            <v-icon
              :color="hasMtls ? 'success' : 'error'"
              size="x-large"
              class="mr-2"
            >
              {{ hasMtls ? 'check_circle' : 'cancel' }}
            </v-icon>
            <span class="text-h6">{{ hasMtls ? t('xroad.status.mtlsEnabled') : t('xroad.status.mtlsDisabled') }}</span>
          </div>
        </v-col>

        <!-- HTTPS No Auth Status -->
        <v-col cols="12" md="2">
          <div class="d-flex align-center">
            <v-icon
              :color="hasHttpsNoAuth ? 'success' : 'error'"
              size="x-large"
              class="mr-2"
            >
              {{ hasHttpsNoAuth ? 'check_circle' : 'cancel' }}
            </v-icon>
            <span class="text-h6">{{ hasHttpsNoAuth ? t('xroad.status.httpsNoAuth') : t('xroad.status.noHttpsCert') }}</span>
          </div>
        </v-col>

        <!-- Request Status -->
        <v-col cols="12" md="2">
          <div class="d-flex align-center">
            <v-icon
              :color="requestStatusColor"
              size="x-large"
              class="mr-2"
            >
              {{ requestStatusIcon }}
            </v-icon>
            <span class="text-h6">{{ requestStatusText }}</span>
          </div>
        </v-col>

        <!-- cURL action group (Import + Export clustered together) -->
        <v-col cols="12" md="4" class="d-flex justify-end align-center ga-2">
          <v-btn
            variant="outlined"
            color="primary"
            size="default"
            @click="emit('requestImport')"
          >
            <v-icon start>download</v-icon>
            {{ t('xroad.action.importCurl') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="primary"
            size="default"
            :disabled="!request || !isServiceComplete"
            @click="copyAsCurl"
          >
            <v-icon start>content_copy</v-icon>
            {{ t('xroad.action.exportCurl') }}
          </v-btn>
        </v-col>

        <!-- Send Button -->
        <v-col cols="12" md="2" class="text-right">
          <v-btn
            color="primary"
            size="x-large"
            block
            :loading="loading"
            :disabled="loading || !isClientComplete || !isServiceComplete"
            @click="emit('submit')"
          >
            <v-icon v-if="!loading" start>send</v-icon>
            {{ loading ? t('xroad.request.sending') : t('xroad.request.submit') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<style scoped>
.status-panel {
  border-top: 2px solid rgb(var(--v-theme-primary));
}

.font-monospace {
  font-family: monospace;
}

.text-break {
  word-break: break-all;
}
</style>
