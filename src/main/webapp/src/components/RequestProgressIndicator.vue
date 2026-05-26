<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { XRoadRequest, MTlsCertificates } from '@/types';
import { useFormFlow, REQUIRED_STEPS, OPTIONAL_STEPS, type StepKey, type StepState } from '@/composables';

const props = defineProps<{
  formData: Partial<XRoadRequest>;
  certificates: MTlsCertificates;
}>();

const emit = defineEmits<{
  navigate: [stepKey: StepKey];
}>();

const { t } = useI18n();

const { stateFor } = useFormFlow(() => ({ ...props.formData, certificates: props.certificates }));

interface Step {
  key: StepKey;
  labelKey: string;
  /** 1-based position in the required sequence; undefined for optional steps. */
  number?: number;
}

const steps: Step[] = [
  ...REQUIRED_STEPS.map((key, i) => ({
    key,
    labelKey: `xroad.progress.${key}`,
    number: i + 1,
  })),
  ...OPTIONAL_STEPS.map((key) => ({
    key,
    labelKey: `xroad.progress.${key}`,
  })),
];

function iconFor(state: StepState): { name: string; color: string } {
  switch (state) {
    case 'done': return { name: 'check_circle', color: 'success' };
    case 'next': return { name: 'play_arrow', color: 'warning' };
    case 'pending': return { name: 'radio_button_unchecked', color: 'grey' };
    case 'optional': return { name: 'radio_button_unchecked', color: 'grey-lighten-1' };
  }
}
</script>

<template>
  <div class="progress-indicator d-flex flex-wrap align-center justify-center px-3 py-1">
    <button
      v-for="step in steps"
      :key="step.key"
      type="button"
      :class="['step d-flex align-center', `step-${stateFor(step.key)}`]"
      @click="emit('navigate', step.key)"
    >
      <v-icon :color="iconFor(stateFor(step.key)).color" size="small" class="mr-1">
        {{ iconFor(stateFor(step.key)).name }}
      </v-icon>
      <span v-if="step.number" class="step-number mr-1">{{ step.number }}.</span>
      <span class="text-body-2">{{ t(step.labelKey) }}</span>
    </button>
  </div>
</template>

<style scoped>
.progress-indicator {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  min-height: 36px;
  row-gap: 6px;
  column-gap: 10px;
}

/* Base chip — outlined, neutral. Per-state classes override below. */
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

.step-number {
  font-weight: 600;
  opacity: 0.7;
}

/* Done — green tinted background, slightly stronger text, full opacity. */
.step-done {
  background-color: rgba(var(--v-theme-success), 0.12);
  border-color: rgba(var(--v-theme-success), 0.4);
  font-weight: 500;
}
.step-done:hover {
  background-color: rgba(var(--v-theme-success), 0.18);
  border-color: rgba(var(--v-theme-success), 0.55);
}

/* Next — amber tinted background, bold, the visual focal point. */
.step-next {
  background-color: rgba(var(--v-theme-warning), 0.18);
  border-color: rgba(var(--v-theme-warning), 0.6);
  font-weight: 700;
}
.step-next:hover {
  background-color: rgba(var(--v-theme-warning), 0.26);
  border-color: rgba(var(--v-theme-warning), 0.75);
}

/* Pending — neutral outline. */
.step-pending {
  /* base styles only */
}

/* Optional — muted. Visually grouped as "extras". */
.step-optional {
  opacity: 0.6;
  font-size: 0.92em;
}
.step-optional:hover {
  opacity: 0.85;
}
</style>
