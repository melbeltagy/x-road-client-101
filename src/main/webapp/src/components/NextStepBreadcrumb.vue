<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { StepKey } from '@/composables';

defineProps<{
  /** Null when nothing is required — the breadcrumb hides itself. */
  nextStepKey: StepKey | null;
}>();

const emit = defineEmits<{
  navigate: [stepKey: StepKey];
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="nextStepKey" class="next-step-breadcrumb">
    <v-icon size="small" color="warning" class="mr-2">play_arrow</v-icon>
    <strong class="mr-2">{{ t('xroad.flow.nextLabel') }}:</strong>
    <button type="button" class="next-link" @click="emit('navigate', nextStepKey)">
      {{ t(`xroad.progress.${nextStepKey}`) }}
    </button>
  </div>
</template>

<style scoped>
.next-step-breadcrumb {
  /* Sticky just below the app bar so the cue follows the user as they scroll. */
  position: sticky;
  top: 64px;
  z-index: 2;

  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin-bottom: 12px;
  background-color: rgba(var(--v-theme-warning), 0.08);
  border-left: 4px solid rgb(var(--v-theme-warning));
  border-radius: 4px;
}

.next-link {
  background: transparent;
  border: none;
  padding: 0;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.next-link:hover {
  text-decoration: none;
}

.next-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
