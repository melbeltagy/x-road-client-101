<script setup lang="ts">
import { ref, nextTick } from 'vue';
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
  openPanels,
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

// Focus an input by id and select its content. Used after step
// navigation so the user can immediately overwrite the existing value.
// preventScroll: true keeps the browser from racing the explicit
// smooth-scroll we kick off in navigateToStep.
function focusAndSelect(inputId: string): void {
  const el = document.getElementById(inputId) as HTMLInputElement | null;
  if (!el) return;
  el.focus({ preventScroll: true });
  el.select?.();
}

// Vuetify's v-expansion-panel transition is ~300ms. Scrolling before
// it settles races a moving target — the panel above is shrinking
// while the target is growing, so the scroll lands mid-shift.
const ACCORDION_TRANSITION_MS = 320;

function waitForAccordion(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ACCORDION_TRANSITION_MS));
}

async function scrollToPanel(panelId: string): Promise<void> {
  await waitForAccordion();
  const el = document.getElementById(panelId);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function scrollToTop(): Promise<void> {
  await waitForAccordion();
  const el = document.getElementById('securityServerUrl');
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

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
  // Navigate to a workflow step from the progress indicator: expand
  // the relevant accordion (collapsing the others), smooth-scroll it
  // into view, and focus the first editable field where it makes sense.
  navigateToStep: async (stepKey: string) => {
    switch (stepKey) {
      case 'securityServer':
        openPanels.value = []; // SS URL is above the accordions
        await scrollToTop();
        focusAndSelect('securityServerUrl');
        break;
      case 'clientIdentifier':
        openPanels.value = ['client'];
        await scrollToPanel('panel-client');
        focusAndSelect('instanceId');
        break;
      case 'serviceIdentifier':
        openPanels.value = ['service'];
        await scrollToPanel('panel-service');
        focusAndSelect('serviceinstanceId');
        break;
      case 'endpoint':
        openPanels.value = ['endpoint'];
        await scrollToPanel('panel-endpoint');
        focusAndSelect('path');
        break;
      case 'queryParameters':
        openPanels.value = ['queryParams'];
        await scrollToPanel('panel-queryParams');
        // no focus — list may be empty
        break;
      case 'customHeaders':
        openPanels.value = ['customHeaders'];
        await scrollToPanel('panel-customHeaders');
        break;
      case 'certificates':
        openPanels.value = ['certificates'];
        await scrollToPanel('panel-certificates');
        // no auto-focus — cert textareas are large and easy to overwrite
        break;
    }
  },
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

      <v-card-text>
        <v-expansion-panels v-model="openPanels" multiple>
          <v-expansion-panel id="panel-client" value="client">
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
                <v-expansion-panel-text eager>
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

              <v-expansion-panel id="panel-service" value="service">
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
                <v-expansion-panel-text eager>
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

          <!-- Endpoint Details -->
          <v-expansion-panel id="panel-endpoint" value="endpoint">
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
                <v-expansion-panel-text eager>
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
              <v-expansion-panel id="panel-queryParams" value="queryParams">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">tune</v-icon>
                    <strong>{{ t('xroad.advanced.queryParams') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text eager>
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
              <v-expansion-panel id="panel-customHeaders" value="customHeaders">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">list_alt</v-icon>
                    <strong>{{ t('xroad.advanced.customHeaders') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text eager>
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

          <!-- Certificates -->
          <v-expansion-panel id="panel-certificates" value="certificates">
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon start color="primary">lock</v-icon>
                    <strong>{{ t('xroad.certificates.title') }}</strong>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text eager>
                  <CertificateSection
                    :certificates="certificates"
                    @update:certificates="certificates = $event"
                  />
                </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-form>
</template>

<style scoped>
.v-card :deep(.v-expansion-panels) {
  gap: 0;
}

/* scrollIntoView targets — leave space at the top so the app bar
   (sticky/fixed at the page top) doesn't cover the scrolled-to title
   or the Security Server URL field. 80px ≈ app bar height + breathing room. */
.v-card :deep(.v-expansion-panel) {
  scroll-margin-top: 80px;
}
#securityServerUrl {
  scroll-margin-top: 80px;
}
</style>
