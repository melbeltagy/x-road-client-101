<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubsystemId } from '@/types';

const props = defineProps<{
  prefix: 'client' | 'service';
  idPrefix?: string;
  instanceId: string;
  memberClass: string;
  memberCode: string;
  subsystemCode: string;
  errors: Record<string, string>;
  suggestions?: SubsystemId[];
}>();

const emit = defineEmits<{
  'update:instanceId': [value: string];
  'update:memberClass': [value: string];
  'update:memberCode': [value: string];
  'update:subsystemCode': [value: string];
  'select': [subsystem: SubsystemId];
}>();

const { t } = useI18n();

// Compute unique values for each field from suggestions
const instanceIdOptions = computed(() => {
  if (!props.suggestions?.length) return [];
  return [...new Set(props.suggestions.map((s) => s.instanceId))];
});

const memberClassOptions = computed(() => {
  if (!props.suggestions?.length) return [];
  // Filter by current instanceId if set
  const filtered = props.instanceId
    ? props.suggestions.filter((s) => s.instanceId === props.instanceId)
    : props.suggestions;
  return [...new Set(filtered.map((s) => s.memberClass))];
});

const memberCodeOptions = computed(() => {
  if (!props.suggestions?.length) return [];
  // Filter by current instanceId and memberClass if set
  let filtered = props.suggestions;
  if (props.instanceId) {
    filtered = filtered.filter((s) => s.instanceId === props.instanceId);
  }
  if (props.memberClass) {
    filtered = filtered.filter((s) => s.memberClass === props.memberClass);
  }
  return [...new Set(filtered.map((s) => s.memberCode))];
});

const subsystemCodeOptions = computed(() => {
  if (!props.suggestions?.length) return [];
  // Filter by all previous fields if set
  let filtered = props.suggestions;
  if (props.instanceId) {
    filtered = filtered.filter((s) => s.instanceId === props.instanceId);
  }
  if (props.memberClass) {
    filtered = filtered.filter((s) => s.memberClass === props.memberClass);
  }
  if (props.memberCode) {
    filtered = filtered.filter((s) => s.memberCode === props.memberCode);
  }
  return [...new Set(filtered.map((s) => s.subsystemCode))];
});

// Check if we have any suggestions
const hasSuggestions = computed(() => (props.suggestions?.length ?? 0) > 0);

// Handle selection - when subsystem code is selected, auto-fill all fields
function handleSubsystemSelect(subsystemCode: string): void {
  emit('update:subsystemCode', subsystemCode);

  // Find matching subsystem and emit select event
  const matching = props.suggestions?.find(
    (s) =>
      s.subsystemCode === subsystemCode &&
      (!props.instanceId || s.instanceId === props.instanceId) &&
      (!props.memberClass || s.memberClass === props.memberClass) &&
      (!props.memberCode || s.memberCode === props.memberCode)
  );

  if (matching) {
    emit('select', matching);
  }
}
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-combobox
        v-if="hasSuggestions"
        :id="`${idPrefix ?? ''}instanceId`"
        :model-value="instanceId"
        @update:model-value="emit('update:instanceId', $event ?? '')"
        :items="instanceIdOptions"
        :label="`${t(`xroad.${prefix}.instanceId`)} *`"
        :placeholder="t('xroad.placeholders.instanceId')"
        :error-messages="errors.instanceId"
        variant="outlined"
        density="comfortable"
        clearable
        :menu-props="{ maxHeight: 200 }"
      />
      <v-text-field
        v-else
        :id="`${idPrefix ?? ''}instanceId`"
        :model-value="instanceId"
        @update:model-value="emit('update:instanceId', $event)"
        :label="`${t(`xroad.${prefix}.instanceId`)} *`"
        :placeholder="t('xroad.placeholders.instanceId')"
        :error-messages="errors.instanceId"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-combobox
        v-if="hasSuggestions"
        :id="`${idPrefix ?? ''}memberClass`"
        :model-value="memberClass"
        @update:model-value="emit('update:memberClass', $event ?? '')"
        :items="memberClassOptions"
        :label="`${t(`xroad.${prefix}.memberClass`)} *`"
        :placeholder="t('xroad.placeholders.memberClass')"
        :error-messages="errors.memberClass"
        variant="outlined"
        density="comfortable"
        clearable
        :menu-props="{ maxHeight: 200 }"
      />
      <v-text-field
        v-else
        :id="`${idPrefix ?? ''}memberClass`"
        :model-value="memberClass"
        @update:model-value="emit('update:memberClass', $event)"
        :label="`${t(`xroad.${prefix}.memberClass`)} *`"
        :placeholder="t('xroad.placeholders.memberClass')"
        :error-messages="errors.memberClass"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="6">
      <v-combobox
        v-if="hasSuggestions"
        :id="`${idPrefix ?? ''}memberCode`"
        :model-value="memberCode"
        @update:model-value="emit('update:memberCode', $event ?? '')"
        :items="memberCodeOptions"
        :label="`${t(`xroad.${prefix}.memberCode`)} *`"
        :placeholder="prefix === 'service' ? t('xroad.placeholders.serviceMemberCode') : t('xroad.placeholders.memberCode')"
        :error-messages="errors.memberCode"
        variant="outlined"
        density="comfortable"
        clearable
        :menu-props="{ maxHeight: 200 }"
      />
      <v-text-field
        v-else
        :id="`${idPrefix ?? ''}memberCode`"
        :model-value="memberCode"
        @update:model-value="emit('update:memberCode', $event)"
        :label="`${t(`xroad.${prefix}.memberCode`)} *`"
        :placeholder="prefix === 'service' ? t('xroad.placeholders.serviceMemberCode') : t('xroad.placeholders.memberCode')"
        :error-messages="errors.memberCode"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-combobox
        v-if="hasSuggestions"
        :id="`${idPrefix ?? ''}subsystemCode`"
        :model-value="subsystemCode"
        @update:model-value="handleSubsystemSelect($event ?? '')"
        :items="subsystemCodeOptions"
        :label="`${t(`xroad.${prefix}.subsystemCode`)} *`"
        :placeholder="prefix === 'service' ? t('xroad.placeholders.serviceSubsystemCode') : t('xroad.placeholders.subsystemCode')"
        :error-messages="errors.subsystemCode"
        variant="outlined"
        density="comfortable"
        clearable
        :menu-props="{ maxHeight: 200 }"
      />
      <v-text-field
        v-else
        :id="`${idPrefix ?? ''}subsystemCode`"
        :model-value="subsystemCode"
        @update:model-value="emit('update:subsystemCode', $event)"
        :label="`${t(`xroad.${prefix}.subsystemCode`)} *`"
        :placeholder="prefix === 'service' ? t('xroad.placeholders.serviceSubsystemCode') : t('xroad.placeholders.subsystemCode')"
        :error-messages="errors.subsystemCode"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
  </v-row>
</template>
