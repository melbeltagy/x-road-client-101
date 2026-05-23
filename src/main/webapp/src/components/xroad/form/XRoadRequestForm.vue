<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { XRoadRequest, MTlsCertificates } from '@/types';
import { useXRoadForm, useXRoadValidation, useServiceDiscovery } from '@/composables';
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

// Initialize composables
const {
  formData,
  certificates,
  queryParams,
  customHeaders,
  activeTab,
  openIdentifierPanels,
  openRequestPanels,
  openSecurityPanels,
  selectedServiceEndpoints,
  availableServices,
  buildRequest,
  clearClient,
  clearService,
  clearRequest,
  addQueryParam,
  removeQueryParam,
  updateQueryParam,
  clearQueryParams,
  addCustomHeader,
  removeCustomHeader,
  updateCustomHeader,
  clearCustomHeaders,
  setAvailableServices,
  watchInitialRequest,
  setupFormChangeWatcher,
  initializeAfterMount,
} = useXRoadForm();

const { errors, isValid, validateForm } = useXRoadValidation();

const {
  subsystemSuggestions,
  isLoadingSuggestions,
  suggestionsError,
  watchSecurityServerUrl,
} = useServiceDiscovery();

// Track services loading and error states (emitted from ServiceSection)
const isLoadingServices = ref(false);
const servicesError = ref<string | null>(null);

// Watch security server URL for subsystem suggestions
watchSecurityServerUrl(() => formData.client.securityServerUrl);

// Watch for initial request changes
watchInitialRequest(
  () => props.initialRequest,
  () => props.isFromHistory ?? false
);

// Setup form change watcher
setupFormChangeWatcher(
  () => errors.value,
  (data, valid, certs) => emit('formChange', data, valid, certs),
  () => emit('requestModified')
);

// Initialize after mount
initializeAfterMount();

// Type helper for HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Submit handler
function handleSubmit(): void {
  // Build form data for validation
  const validationData = {
    client: {
      subsystem: formData.client.subsystem,
      securityServerUrl: formData.client.securityServerUrl,
    },
    service: {
      subsystem: formData.service.subsystem,
      serviceCode: formData.service.serviceCode,
      serviceVersion: formData.service.serviceVersion,
    },
    request: {
      method: formData.request.method,
      path: formData.request.path,
      body: formData.request.body,
      contentType: formData.request.contentType,
    },
  };

  if (validateForm(validationData)) {
    emit('submit', buildRequest());
  }
}

// Expose submit handler for external trigger
defineExpose({
  submit: handleSubmit,
  validate: () => validateForm({
    client: {
      subsystem: formData.client.subsystem,
      securityServerUrl: formData.client.securityServerUrl,
    },
    service: {
      subsystem: formData.service.subsystem,
      serviceCode: formData.service.serviceCode,
      serviceVersion: formData.service.serviceVersion,
    },
    request: {
      method: formData.request.method,
      path: formData.request.path,
      body: formData.request.body,
      contentType: formData.request.contentType,
    },
  }),
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
                    <v-progress-circular
                      v-if="isLoadingSuggestions"
                      indeterminate
                      size="16"
                      width="2"
                      color="primary"
                      class="ml-2"
                    />
                    <v-chip
                      v-else-if="subsystemSuggestions.length > 0"
                      size="small"
                      color="success"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ t('xroad.client.suggestionsAvailable', { count: subsystemSuggestions.length }) }}
                    </v-chip>
                    <v-chip
                      v-else-if="suggestionsError"
                      size="small"
                      color="warning"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ suggestionsError }}
                    </v-chip>
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
                    @clear="clearClient"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel value="service">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">dns</v-icon>
                    <strong>{{ t('xroad.service.title') }}</strong>
                    <v-progress-circular
                      v-if="isLoadingServices"
                      indeterminate
                      size="16"
                      width="2"
                      color="primary"
                      class="ml-2"
                    />
                    <v-chip
                      v-else-if="availableServices.length > 0"
                      size="small"
                      color="success"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ t('xroad.service.servicesAvailable', { count: availableServices.length }) }}
                    </v-chip>
                    <v-chip
                      v-else-if="servicesError"
                      size="small"
                      color="warning"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ servicesError }}
                    </v-chip>
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
                    @update:available-services="setAvailableServices($event)"
                    @update:is-loading-services="isLoadingServices = $event"
                    @update:services-error="servicesError = $event"
                    @clear="clearService"
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
                    <v-progress-circular
                      v-if="isLoadingServices"
                      indeterminate
                      size="16"
                      width="2"
                      color="primary"
                      class="ml-2"
                    />
                    <v-chip
                      v-else-if="selectedServiceEndpoints.length > 0"
                      size="small"
                      color="success"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ t('xroad.request.endpointsAvailable', { count: selectedServiceEndpoints.length }) }}
                    </v-chip>
                    <v-chip
                      v-else-if="servicesError"
                      size="small"
                      color="warning"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ servicesError }}
                    </v-chip>
                    <v-chip
                      v-else-if="availableServices.length > 0 && formData.service.serviceCode"
                      size="small"
                      color="info"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ t('xroad.request.serviceNotFound') }}
                    </v-chip>
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
                    @clear="clearRequest"
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
.v-card :deep(.v-expansion-panels) {
  gap: 0;
}
</style>
