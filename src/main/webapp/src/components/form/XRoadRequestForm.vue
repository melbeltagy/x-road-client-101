<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { XRoadRequest, MTlsCertificates, ServiceEndpoint } from '@/types';
import type { HttpMethod } from '@/utils/http-methods';
import {
  useXRoadForm,
  useXRoadValidation,
  useSubsystemSuggestions,
  useServicesLoader,
  useFormStepNavigation,
  useFormCompleteness,
  useFormFlow,
  type StepKey,
} from '@/composables';
import ClientSection from './sections/ClientSection.vue';
import ServiceSection from './sections/ServiceSection.vue';
import CertificateSection from './sections/CertificateSection.vue';
import RequestSection from './sections/RequestSection.vue';
import KeyValueEditor from '@/components/common/KeyValueEditor.vue';
import SectionPanel from './sections/shell/SectionPanel.vue';
import SectionStatusChip from './sections/shell/SectionStatusChip.vue';

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

// useXRoadValidation must be constructed before useXRoadForm so that
// errorsGetter can read its `errors` ref. (The getter is only invoked
// later when the form-change watcher fires, but the reference is captured
// at composable construction.)
const { errors, isValid, validateForm } = useXRoadValidation();

const {
  formData,
  certificates,
  queryParams,
  customHeaders,
  openPanels,
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
} = useXRoadForm({
  initialRequestGetter: () => props.initialRequest,
  isFromHistoryGetter: () => props.isFromHistory ?? false,
  errorsGetter: () => errors.value,
  onFormChange: (data, valid, certs) => emit('formChange', data, valid, certs),
  onRequestModified: () => emit('requestModified'),
});

const {
  subsystemSuggestions,
  isLoadingSuggestions,
  suggestionsError,
  watchSecurityServerUrl,
} = useSubsystemSuggestions();

// Single source of truth for the available services on the current
// (security server, client subsystem, service subsystem) triple.
const {
  availableServices,
  isLoading: isLoadingServices,
  error: servicesError,
} = useServicesLoader(
  () => formData.client.securityServerUrl,
  () => formData.client.subsystem,
  () => formData.service.subsystem,
);

// Endpoints for the selected service code. Derived locally so we don't
// have to mirror availableServices into useXRoadForm.
const selectedServiceEndpoints = computed<ServiceEndpoint[]>(() => {
  const code = formData.service.serviceCode;
  if (!code || availableServices.value.length === 0) return [];
  return availableServices.value.find((s) => s.serviceCode === code)?.endpoints ?? [];
});

// Per-section state for accordion visual treatment (done / next / pending / optional).
const { stateFor } = useFormFlow(() => ({ ...formData, certificates: certificates.value }));

// The Service section's title chip shows two different counts depending
// on which step the user is on. Before the service subsystem is fully
// picked, the actionable list is "subsystems available to call as a
// service provider" — i.e., the same suggestion list the client picker
// uses. Once the service subsystem is locked in and `useServicesLoader`
// has populated `availableServices`, the chip switches to "services
// available on this provider."
const { serviceSubsystemComplete } = useFormCompleteness(() => ({
  service: { subsystem: formData.service.subsystem },
}));
const serviceSectionChipCount = computed(() =>
  serviceSubsystemComplete.value ? availableServices.value.length : subsystemSuggestions.value.length
);
const serviceSectionChipText = computed(() =>
  serviceSubsystemComplete.value
    ? t('xroad.service.servicesAvailable', { count: availableServices.value.length })
    : t('xroad.service.providersAvailable', { count: subsystemSuggestions.value.length })
);

// When the service subsystem is complete but the upstream returned zero
// services, the success chip (gated on count > 0) would silently
// disappear and make it look like nothing happened. Surface "0 services
// available" via the info chip so the user knows the call ran.
const serviceSectionChipInfoText = computed(() => {
  if (!serviceSubsystemComplete.value) return null;
  if (isLoadingServices.value) return null;
  if (servicesError.value) return null;
  if (availableServices.value.length > 0) return null;
  return t('xroad.service.servicesAvailable', { count: 0 });
});

// Watch security server URL for subsystem suggestions
watchSecurityServerUrl(() => formData.client.securityServerUrl);

// Accordion expand + smooth scroll + focus on chip click (from progress indicator).
const { navigateToStep } = useFormStepNavigation(openPanels);

function handleSubmit(): void {
  if (validateForm(formData)) {
    emit('submit', buildRequest());
  }
}

defineExpose({
  submit: handleSubmit,
  validate: () => validateForm(formData),
  navigateToStep: (stepKey: string) => navigateToStep(stepKey as StepKey),
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
          <SectionPanel value="client" icon="person" :title="t('xroad.client.title')" :state="stateFor('clientIdentifier')">
            <template #chip>
              <SectionStatusChip
                :loading="isLoadingSuggestions"
                :success-count="subsystemSuggestions.length"
                :success-text="t('xroad.client.suggestionsAvailable', { count: subsystemSuggestions.length })"
                :error="suggestionsError"
              />
            </template>
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
          </SectionPanel>

          <SectionPanel value="service" icon="dns" :title="t('xroad.service.title')" :state="stateFor('serviceIdentifier')">
            <template #chip>
              <SectionStatusChip
                :loading="isLoadingServices"
                :success-count="serviceSectionChipCount"
                :success-text="serviceSectionChipText"
                :error="servicesError"
                :info-text="serviceSectionChipInfoText"
              />
            </template>
            <ServiceSection
              :subsystem="formData.service.subsystem"
              :service-code="formData.service.serviceCode"
              :service-version="formData.service.serviceVersion"
              :errors="errors"
              :suggestions="subsystemSuggestions"
              :available-services="availableServices"
              @update:subsystem="formData.service.subsystem = $event"
              @update:service-code="formData.service.serviceCode = $event"
              @update:service-version="formData.service.serviceVersion = $event"
              @clear="clearService"
            />
          </SectionPanel>

          <SectionPanel value="endpoint" icon="send" :title="t('xroad.request.title')" :state="stateFor('endpoint')">
            <template #chip>
              <SectionStatusChip
                :loading="isLoadingServices"
                :success-count="selectedServiceEndpoints.length"
                :success-text="t('xroad.request.endpointsAvailable', { count: selectedServiceEndpoints.length })"
                :error="servicesError"
                :info-text="availableServices.length > 0 && formData.service.serviceCode ? t('xroad.request.serviceNotFound') : null"
              />
            </template>
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
          </SectionPanel>

          <SectionPanel value="queryParams" icon="tune" :title="t('xroad.advanced.queryParams')" :state="stateFor('queryParameters')">
            <KeyValueEditor
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
          </SectionPanel>

          <SectionPanel value="customHeaders" icon="list_alt" :title="t('xroad.advanced.customHeaders')" :state="stateFor('customHeaders')">
            <KeyValueEditor
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
          </SectionPanel>

          <SectionPanel value="certificates" icon="lock" :title="t('xroad.certificates.title')" :state="stateFor('certificates')">
            <CertificateSection
              :certificates="certificates"
              @update:certificates="certificates = $event"
            />
          </SectionPanel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-form>
</template>

<style scoped>
.v-card :deep(.v-expansion-panels) {
  gap: 0;
}
</style>
