<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { XRoadRequest, MTlsCertificates, SubsystemId, ServiceInfo, ServiceEndpoint } from '@/types';
import { type KeyValuePair } from './KeyValuePairList.vue';
import { fetchRegisteredClients } from '@/services/security-server.service';
import ClientSection from './ClientSection.vue';
import ServiceSection from './ServiceSection.vue';
import CertificateSection from './CertificateSection.vue';
import RequestSection from './RequestSection.vue';
import KeyValuePairList from './KeyValuePairList.vue';

const props = defineProps<{
  initialRequest?: XRoadRequest | null;
  isFromHistory?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: XRoadRequest];
  formChange: [formData: Partial<XRoadRequest>, isValid: boolean, certificates: MTlsCertificates];
  requestModified: [];
}>();

const { t } = useI18n();

// Default empty subsystem
const emptySubsystem = (): SubsystemId => ({
  instanceId: '',
  memberClass: '',
  memberCode: '',
  subsystemCode: '',
});

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Form state
const formData = reactive({
  client: {
    subsystem: emptySubsystem(),
    securityServerUrl: '',
  },
  service: {
    subsystem: emptySubsystem(),
    serviceCode: '',
    serviceVersion: '',
  },
  request: {
    method: 'GET' as HttpMethod,
    path: '',
    body: '',
    contentType: '',
  },
});

// Certificates are managed separately (not persisted in history)
const certificates = ref<MTlsCertificates>({});

// Key-value lists for query params and custom headers
const queryParams = ref<KeyValuePair[]>([]);
const customHeaders = ref<KeyValuePair[]>([]);

// Tab state
const activeTab = ref('identifiers');

// Expansion panel state for Identifiers tab
const openIdentifierPanels = ref(['client', 'service']);

// Expansion panel state for Request tab (only endpoint expanded by default)
const openRequestPanels = ref(['endpoint']);

// Expansion panel state for Security tab
const openSecurityPanels = ref(['certificates']);

// Subsystem suggestions from security server
const subsystemSuggestions = ref<SubsystemId[]>([]);
const isLoadingSuggestions = ref(false);
const suggestionsError = ref<string | null>(null);
let suggestionsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Available services from selected service provider
const availableServices = ref<ServiceInfo[]>([]);

// Compute endpoints for the selected service
const selectedServiceEndpoints = computed<ServiceEndpoint[]>(() => {
  if (!formData.service.serviceCode || availableServices.value.length === 0) {
    return [];
  }
  const selectedService = availableServices.value.find(
    (s) => s.serviceCode === formData.service.serviceCode
  );
  return selectedService?.endpoints ?? [];
});

// Fetch subsystem suggestions when security server URL changes
async function loadSubsystemSuggestions(url: string): Promise<void> {
  if (!url) {
    subsystemSuggestions.value = [];
    suggestionsError.value = null;
    return;
  }

  try {
    new URL(url);
  } catch {
    subsystemSuggestions.value = [];
    return;
  }

  isLoadingSuggestions.value = true;
  suggestionsError.value = null;

  try {
    const clients = await fetchRegisteredClients(url);
    subsystemSuggestions.value = clients;
  } catch (error) {
    console.error('Failed to fetch subsystem suggestions:', error);
    suggestionsError.value = t('xroad.client.fetchError');
    subsystemSuggestions.value = [];
  } finally {
    isLoadingSuggestions.value = false;
  }
}

watch(
  () => formData.client.securityServerUrl,
  (newUrl) => {
    if (suggestionsDebounceTimer) {
      clearTimeout(suggestionsDebounceTimer);
    }
    suggestionsDebounceTimer = setTimeout(() => {
      loadSubsystemSuggestions(newUrl);
    }, 500);
  },
  { immediate: true }
);

// Validation errors
const errors = ref<Record<string, string>>({});

// Track initial load state
const isInitialLoad = ref(true);

// Validation rules
function validateForm(): boolean {
  const newErrors: Record<string, string> = {};

  // Client subsystem validation
  if (!formData.client.subsystem.instanceId) {
    newErrors['client.subsystem.instanceId'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]{2,}$/.test(formData.client.subsystem.instanceId)) {
    newErrors['client.subsystem.instanceId'] = t('xroad.validation.instanceId');
  }

  if (!formData.client.subsystem.memberClass) {
    newErrors['client.subsystem.memberClass'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.client.subsystem.memberClass)) {
    newErrors['client.subsystem.memberClass'] = t('xroad.validation.memberClass');
  }

  if (!formData.client.subsystem.memberCode) {
    newErrors['client.subsystem.memberCode'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.client.subsystem.memberCode)) {
    newErrors['client.subsystem.memberCode'] = t('xroad.validation.memberCode');
  }

  if (!formData.client.subsystem.subsystemCode) {
    newErrors['client.subsystem.subsystemCode'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.client.subsystem.subsystemCode)) {
    newErrors['client.subsystem.subsystemCode'] = t('xroad.validation.subsystemCode');
  }

  // Security Server URL validation
  if (!formData.client.securityServerUrl) {
    newErrors['client.securityServerUrl'] = t('xroad.validation.required');
  } else {
    try {
      const url = new URL(formData.client.securityServerUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrlProtocol');
      } else if (url.hostname.includes('_')) {
        newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrlUnderscore');
      } else if (!url.hostname) {
        newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrlHostname');
      }
    } catch {
      newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrl');
    }
  }

  // Service subsystem validation
  if (!formData.service.subsystem.instanceId) {
    newErrors['service.subsystem.instanceId'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]{2,}$/.test(formData.service.subsystem.instanceId)) {
    newErrors['service.subsystem.instanceId'] = t('xroad.validation.instanceId');
  }

  if (!formData.service.subsystem.memberClass) {
    newErrors['service.subsystem.memberClass'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.service.subsystem.memberClass)) {
    newErrors['service.subsystem.memberClass'] = t('xroad.validation.memberClass');
  }

  if (!formData.service.subsystem.memberCode) {
    newErrors['service.subsystem.memberCode'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.service.subsystem.memberCode)) {
    newErrors['service.subsystem.memberCode'] = t('xroad.validation.memberCode');
  }

  if (!formData.service.subsystem.subsystemCode) {
    newErrors['service.subsystem.subsystemCode'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9-]+$/.test(formData.service.subsystem.subsystemCode)) {
    newErrors['service.subsystem.subsystemCode'] = t('xroad.validation.subsystemCode');
  }

  // Service code validation
  if (!formData.service.serviceCode) {
    newErrors['service.serviceCode'] = t('xroad.validation.required');
  } else if (!/^[A-Za-z0-9_-]+$/.test(formData.service.serviceCode)) {
    newErrors['service.serviceCode'] = t('xroad.validation.serviceCode');
  }

  // Service version validation (optional)
  if (formData.service.serviceVersion && !/^v?[0-9]+(\.[0-9]+)*$/.test(formData.service.serviceVersion)) {
    newErrors['service.serviceVersion'] = t('xroad.validation.serviceVersion');
  }

  // Request validation
  if (!formData.request.method) {
    newErrors['request.method'] = t('xroad.validation.method');
  }

  if (!formData.request.path) {
    newErrors['request.path'] = t('xroad.validation.required');
  } else if (!/^\/[A-Za-z0-9/_-]*$/.test(formData.request.path)) {
    newErrors['request.path'] = t('xroad.validation.path');
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

const isValid = computed(() => {
  return Object.keys(errors.value).length === 0;
});

// Build XRoadRequest from form data
function buildRequest(): XRoadRequest {
  const request: XRoadRequest = {
    client: {
      subsystem: { ...formData.client.subsystem },
      securityServerUrl: formData.client.securityServerUrl,
    },
    service: {
      subsystem: { ...formData.service.subsystem },
      serviceCode: formData.service.serviceCode,
      serviceVersion: formData.service.serviceVersion || undefined,
    },
    request: {
      method: formData.request.method,
      path: formData.request.path,
      body: formData.request.body || undefined,
      contentType: formData.request.contentType || undefined,
    },
  };

  // Add mTLS certificates if any are provided
  const hasAnyCertificate =
    (certificates.value.securityServerCert?.trim()) ||
    (certificates.value.clientCert?.trim()) ||
    (certificates.value.clientPrivateKey?.trim());

  if (hasAnyCertificate) {
    request.client.mtlsCertificates = {
      securityServerCert: certificates.value.securityServerCert?.trim() || undefined,
      clientCert: certificates.value.clientCert?.trim() || undefined,
      clientPrivateKey: certificates.value.clientPrivateKey?.trim() || undefined,
    };
  }

  // Convert queryParams array to object
  if (queryParams.value.length > 0) {
    const params: Record<string, string> = {};
    queryParams.value.forEach((param) => {
      if (param.key && param.value) {
        params[param.key] = param.value;
      }
    });
    if (Object.keys(params).length > 0) {
      request.request.queryParams = params;
    }
  }

  // Convert customHeaders array to object
  if (customHeaders.value.length > 0) {
    const headers: Record<string, string> = {};
    customHeaders.value.forEach((header) => {
      if (header.key && header.value) {
        headers[header.key] = header.value;
      }
    });
    if (Object.keys(headers).length > 0) {
      request.request.headers = headers;
    }
  }

  return request;
}

// Submit handler
function handleSubmit(): void {
  if (validateForm()) {
    emit('submit', buildRequest());
  }
}

// Populate form from initial request
function populateFromRequest(request: XRoadRequest): void {
  isInitialLoad.value = true;

  // Client
  formData.client.subsystem = { ...request.client.subsystem };
  formData.client.securityServerUrl = request.client.securityServerUrl;

  // Service
  formData.service.subsystem = { ...request.service.subsystem };
  formData.service.serviceCode = request.service.serviceCode;
  formData.service.serviceVersion = request.service.serviceVersion ?? '';

  // Request
  formData.request.method = request.request.method;
  formData.request.path = request.request.path;
  formData.request.body = request.request.body ?? '';
  formData.request.contentType = request.request.contentType ?? '';

  // Query params
  if (request.request.queryParams) {
    queryParams.value = Object.entries(request.request.queryParams).map(([key, value], index) => ({
      id: `qp-${Date.now()}-${index}`,
      key,
      value,
    }));
  } else {
    queryParams.value = [];
  }

  // Custom headers
  if (request.request.headers) {
    customHeaders.value = Object.entries(request.request.headers).map(([key, value], index) => ({
      id: `ch-${Date.now()}-${index}`,
      key,
      value,
    }));
  } else {
    customHeaders.value = [];
  }

  // Certificates are NOT populated from history for security
  certificates.value = {};

  setTimeout(() => {
    isInitialLoad.value = false;
    // Explicitly emit formChange so parent receives the populated data
    emit('formChange', buildRequest(), Object.keys(errors.value).length === 0, certificates.value);
  }, 0);
}

// Watch for initial request changes
watch(
  () => props.initialRequest,
  (newRequest) => {
    if (newRequest && props.isFromHistory) {
      populateFromRequest(newRequest);
    }
  },
  { immediate: true }
);

// Set isInitialLoad to false after mount (for fresh forms without history)
onMounted(() => {
  setTimeout(() => {
    if (isInitialLoad.value) {
      isInitialLoad.value = false;
    }
  }, 0);
});

// Computed to track all form data changes
const formDataSnapshot = computed(() => ({
  clientInstanceId: formData.client.subsystem.instanceId,
  clientMemberClass: formData.client.subsystem.memberClass,
  clientMemberCode: formData.client.subsystem.memberCode,
  clientSubsystemCode: formData.client.subsystem.subsystemCode,
  securityServerUrl: formData.client.securityServerUrl,
  serviceInstanceId: formData.service.subsystem.instanceId,
  serviceMemberClass: formData.service.subsystem.memberClass,
  serviceMemberCode: formData.service.subsystem.memberCode,
  serviceSubsystemCode: formData.service.subsystem.subsystemCode,
  serviceCode: formData.service.serviceCode,
  serviceVersion: formData.service.serviceVersion,
  method: formData.request.method,
  path: formData.request.path,
  body: formData.request.body,
  contentType: formData.request.contentType,
  queryParams: queryParams.value.length,
  customHeaders: customHeaders.value.length,
  certificates: Object.keys(certificates.value).length,
}));

// Watch for form changes to notify parent
watch(
  formDataSnapshot,
  () => {
    if (!isInitialLoad.value) {
      emit('formChange', buildRequest(), Object.keys(errors.value).length === 0, certificates.value);
      if (props.isFromHistory) {
        emit('requestModified');
      }
    }
  },
  { deep: true }
);

// Clear handlers
function handleClearClient(): void {
  formData.client.subsystem = emptySubsystem();
}

function handleClearSecurityServerUrl(): void {
  formData.client.securityServerUrl = '';
}

function handleClearService(): void {
  formData.service.subsystem = emptySubsystem();
  formData.service.serviceCode = '';
  formData.service.serviceVersion = '';
}

function handleClearRequest(): void {
  formData.request.method = 'GET';
  formData.request.path = '';
  formData.request.body = '';
  formData.request.contentType = '';
  queryParams.value = [];
  customHeaders.value = [];
}

// Query param handlers
function addQueryParam(): void {
  queryParams.value.push({ id: `qp-${Date.now()}-${Math.random()}`, key: '', value: '' });
}

function removeQueryParam(index: number): void {
  queryParams.value.splice(index, 1);
}

function updateQueryParam(index: number, field: 'key' | 'value', value: string): void {
  queryParams.value[index][field] = value;
}

function clearQueryParams(): void {
  queryParams.value = [];
}

// Custom header handlers
function addCustomHeader(): void {
  customHeaders.value.push({ id: `ch-${Date.now()}-${Math.random()}`, key: '', value: '' });
}

function removeCustomHeader(index: number): void {
  customHeaders.value.splice(index, 1);
}

function updateCustomHeader(index: number, field: 'key' | 'value', value: string): void {
  customHeaders.value[index][field] = value;
}

function clearCustomHeaders(): void {
  customHeaders.value = [];
}

// Expose submit handler for external trigger
defineExpose({
  submit: handleSubmit,
  validate: validateForm,
  isValid,
});
</script>

<template>
  <v-form @submit.prevent="handleSubmit">
    <v-card flat color="transparent">
      <!-- Security Server URL Section -->
      <v-card-text class="pb-0">
        <v-text-field
          id="securityServerUrl"
          v-model="formData.client.securityServerUrl"
          :label="`${t('xroad.client.securityServerUrl')} *`"
          :placeholder="t('xroad.placeholders.securityServerUrl')"
          :error-messages="errors['client.securityServerUrl']"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="dns"
          clearable
        />
      </v-card-text>

      <v-divider />

      <div class="pa-2">
        <v-btn-toggle
          v-model="activeTab"
          mandatory
          color="primary"
          variant="outlined"
          divided
          class="w-100"
        >
          <v-btn value="identifiers" class="flex-grow-1">
            <v-icon start size="large">badge</v-icon>
            {{ t('xroad.tabs.identifiers') }}
          </v-btn>
          <v-btn value="request" class="flex-grow-1">
            <v-icon start size="large">send</v-icon>
            {{ t('xroad.tabs.request') }}
          </v-btn>
          <v-btn value="security" class="flex-grow-1">
            <v-icon start size="large">security</v-icon>
            {{ t('xroad.tabs.security') }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <v-divider />

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Identifiers Tab -->
          <v-window-item value="identifiers">
            <v-expansion-panels v-model="openIdentifierPanels" multiple>
              <v-expansion-panel value="client">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">person</v-icon>
                    <strong>{{ t('xroad.client.title') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ClientSection
                    :subsystem="formData.client.subsystem"
                    :security-server-url="formData.client.securityServerUrl"
                    :errors="errors"
                    :suggestions="subsystemSuggestions"
                    :is-loading="isLoadingSuggestions"
                    :fetch-error="suggestionsError"
                    @update:subsystem="formData.client.subsystem = $event"
                    @clear="handleClearClient"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel value="service">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">dns</v-icon>
                    <strong>{{ t('xroad.service.title') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ServiceSection
                    :subsystem="formData.service.subsystem"
                    :service-code="formData.service.serviceCode"
                    :service-version="formData.service.serviceVersion"
                    :errors="errors"
                    :suggestions="subsystemSuggestions"
                    :client-subsystem="formData.client.subsystem"
                    :security-server-url="formData.client.securityServerUrl"
                    @update:subsystem="formData.service.subsystem = $event"
                    @update:service-code="formData.service.serviceCode = $event"
                    @update:service-version="formData.service.serviceVersion = $event"
                    @update:available-services="availableServices = $event"
                    @clear="handleClearService"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-window-item>

          <!-- Request Tab -->
          <v-window-item value="request">
            <v-expansion-panels v-model="openRequestPanels" multiple>
              <!-- Endpoint Details -->
              <v-expansion-panel value="endpoint">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">send</v-icon>
                    <strong>{{ t('xroad.request.title') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <RequestSection
                    :method="formData.request.method"
                    :path="formData.request.path"
                    :body="formData.request.body"
                    :content-type="formData.request.contentType"
                    :errors="errors"
                    :endpoints="selectedServiceEndpoints"
                    @update:method="formData.request.method = $event as HttpMethod"
                    @update:path="formData.request.path = $event"
                    @update:body="formData.request.body = $event"
                    @update:content-type="formData.request.contentType = $event"
                    @clear="handleClearRequest"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Query Parameters -->
              <v-expansion-panel value="queryParams">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">tune</v-icon>
                    <strong>{{ t('xroad.advanced.queryParams') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <KeyValuePairList
                    :items="queryParams"
                    key-placeholder-key="xroad.advanced.key"
                    value-placeholder-key="xroad.advanced.value"
                    empty-message-key="xroad.advanced.noQueryParams"
                    :show-title="false"
                    @add="addQueryParam"
                    @remove="removeQueryParam"
                    @update="updateQueryParam"
                    @clear="clearQueryParams"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Custom Headers -->
              <v-expansion-panel value="customHeaders">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">list_alt</v-icon>
                    <strong>{{ t('xroad.advanced.customHeaders') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <KeyValuePairList
                    :items="customHeaders"
                    key-placeholder-key="xroad.advanced.headerName"
                    value-placeholder-key="xroad.advanced.headerValue"
                    empty-message-key="xroad.advanced.noCustomHeaders"
                    :show-title="false"
                    @add="addCustomHeader"
                    @remove="removeCustomHeader"
                    @update="updateCustomHeader"
                    @clear="clearCustomHeaders"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-window-item>

          <!-- Security Tab -->
          <v-window-item value="security">
            <v-expansion-panels v-model="openSecurityPanels" multiple>
              <v-expansion-panel value="certificates">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">lock</v-icon>
                    <strong>{{ t('xroad.certificates.title') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <CertificateSection
                    :certificates="certificates"
                    @update:certificates="certificates = $event"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-form>
</template>

<style scoped>
:deep(.v-expansion-panels) {
  gap: 0;
}
</style>
