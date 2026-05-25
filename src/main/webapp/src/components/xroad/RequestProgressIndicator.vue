<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { XRoadRequest, MTlsCertificates } from '@/types';

export type StepKey =
  | 'securityServer'
  | 'clientIdentifier'
  | 'serviceIdentifier'
  | 'endpoint'
  | 'queryParameters'
  | 'customHeaders'
  | 'certificates';

const props = defineProps<{
  formData: Partial<XRoadRequest>;
  certificates: MTlsCertificates;
}>();

const emit = defineEmits<{
  navigate: [stepKey: StepKey];
}>();

const { t } = useI18n();

const securityServerComplete = computed(() => !!props.formData.client?.securityServerUrl?.trim());

const clientIdComplete = computed(() => {
  const s = props.formData.client?.subsystem;
  return !!(s?.instanceId && s?.memberClass && s?.memberCode && s?.subsystemCode);
});

const serviceIdComplete = computed(() => {
  const s = props.formData.service?.subsystem;
  const code = props.formData.service?.serviceCode;
  return !!(s?.instanceId && s?.memberClass && s?.memberCode && s?.subsystemCode && code);
});

const endpointComplete = computed(() => {
  const r = props.formData.request;
  return !!(r?.method && r?.path);
});

const queryParametersComplete = computed(() => {
  const q = props.formData.request?.queryParams;
  return !!(q && Object.keys(q).length > 0);
});

const customHeadersComplete = computed(() => {
  const h = props.formData.request?.headers;
  return !!(h && Object.keys(h).length > 0);
});

const certificatesComplete = computed(() => {
  const c = props.certificates;
  return !!(c.clientCert || c.clientPrivateKey || c.securityServerCert);
});

// Required sequence. Optional steps are excluded from the "Next" pointer.
const requiredSteps: StepKey[] = ['securityServer', 'clientIdentifier', 'serviceIdentifier', 'endpoint'];

const isComplete = (key: StepKey): boolean => {
  switch (key) {
    case 'securityServer': return securityServerComplete.value;
    case 'clientIdentifier': return clientIdComplete.value;
    case 'serviceIdentifier': return serviceIdComplete.value;
    case 'endpoint': return endpointComplete.value;
    case 'queryParameters': return queryParametersComplete.value;
    case 'customHeaders': return customHeadersComplete.value;
    case 'certificates': return certificatesComplete.value;
  }
};

const nextStep = computed<StepKey | null>(() => {
  for (const step of requiredSteps) {
    if (!isComplete(step)) return step;
  }
  return null;
});

interface Step {
  key: StepKey;
  labelKey: string;
  optional?: boolean;
}

const steps: Step[] = [
  { key: 'securityServer', labelKey: 'xroad.progress.securityServer' },
  { key: 'clientIdentifier', labelKey: 'xroad.progress.clientIdentifier' },
  { key: 'serviceIdentifier', labelKey: 'xroad.progress.serviceIdentifier' },
  { key: 'endpoint', labelKey: 'xroad.progress.endpoint' },
  { key: 'queryParameters', labelKey: 'xroad.progress.queryParameters', optional: true },
  { key: 'customHeaders', labelKey: 'xroad.progress.customHeaders', optional: true },
  { key: 'certificates', labelKey: 'xroad.progress.certificates', optional: true },
];

function iconFor(step: Step): { name: string; color: string } {
  if (isComplete(step.key)) return { name: 'check_circle', color: 'success' };
  if (step.optional) return { name: 'radio_button_unchecked', color: 'grey-lighten-1' };
  if (nextStep.value === step.key) return { name: 'warning', color: 'warning' };
  return { name: 'radio_button_unchecked', color: 'grey' };
}
</script>

<template>
  <div class="progress-indicator d-flex flex-wrap align-center justify-center px-3 py-1">
    <button
      v-for="step in steps"
      :key="step.key"
      type="button"
      :class="[
        'step d-flex align-center',
        step.optional && !isComplete(step.key) ? 'text-medium-emphasis' : '',
      ]"
      @click="emit('navigate', step.key)"
    >
      <v-icon :color="iconFor(step).color" size="small" class="mr-1">
        {{ iconFor(step).name }}
      </v-icon>
      <span class="text-body-2">{{ t(step.labelKey) }}</span>
      <span
        v-if="nextStep === step.key"
        class="next-marker text-caption text-warning ml-1"
      >
        ← {{ t('xroad.progress.next') }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.progress-indicator {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  min-height: 36px;
  /* row-gap separates wrapped lines; column-gap separates chips on the same line. */
  row-gap: 6px;
  column-gap: 10px;
}

/* Each step is a self-contained chip: subtle outline at rest, soft fill
   on hover. No separators between items — the chip border gives each
   one its own visual boundary. */
.step {
  white-space: nowrap;
  background: transparent;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 4px 10px;
  border-radius: 16px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.step:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.06);
  border-color: rgba(var(--v-theme-on-surface), 0.25);
}

.step:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.next-marker {
  font-weight: 500;
}
</style>
