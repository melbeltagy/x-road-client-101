<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SubsystemIdFields from './SubsystemIdFields.vue';
import type { SubsystemId } from '@/types';

const props = defineProps<{
  subsystem: SubsystemId;
  securityServerUrl: string;
  errors: Record<string, string>;
  suggestions?: SubsystemId[];
  isLoading?: boolean;
  fetchError?: string | null;
}>();

const emit = defineEmits<{
  'update:subsystem': [value: SubsystemId];
  clear: [];
}>();

const { t } = useI18n();

function updateSubsystemField(field: keyof SubsystemId, value: string): void {
  emit('update:subsystem', {
    ...props.subsystem,
    [field]: value,
  });
}

function handleSubsystemSelect(subsystem: SubsystemId): void {
  emit('update:subsystem', { ...subsystem });
}
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-2">
      <div class="d-flex align-center">
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          size="16"
          width="2"
          color="primary"
          class="mr-2"
        />
        <v-chip
          v-if="suggestions && suggestions.length > 0"
          size="small"
          color="success"
          variant="tonal"
        >
          {{ t('xroad.client.suggestionsAvailable', { count: suggestions.length }) }}
        </v-chip>
        <v-chip
          v-else-if="fetchError"
          size="small"
          color="warning"
          variant="tonal"
        >
          {{ fetchError }}
        </v-chip>
      </div>
      <v-btn
        size="small"
        variant="tonal"
        color="error"
        @click="emit('clear')"
        :title="t('xroad.client.clear')"
      >
        <v-icon start>delete</v-icon>
        {{ t('entity.action.clear') }}
      </v-btn>
    </div>

    <SubsystemIdFields
      prefix="client"
      :instance-id="subsystem.instanceId"
      :member-class="subsystem.memberClass"
      :member-code="subsystem.memberCode"
      :subsystem-code="subsystem.subsystemCode"
      :errors="{
        instanceId: errors['client.subsystem.instanceId'] ?? '',
        memberClass: errors['client.subsystem.memberClass'] ?? '',
        memberCode: errors['client.subsystem.memberCode'] ?? '',
        subsystemCode: errors['client.subsystem.subsystemCode'] ?? '',
      }"
      :suggestions="suggestions"
      @update:instance-id="updateSubsystemField('instanceId', $event)"
      @update:member-class="updateSubsystemField('memberClass', $event)"
      @update:member-code="updateSubsystemField('memberCode', $event)"
      @update:subsystem-code="updateSubsystemField('subsystemCode', $event)"
      @select="handleSubsystemSelect"
    />
  </div>
</template>
