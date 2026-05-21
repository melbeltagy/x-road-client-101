<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import SubsystemIdFields from './SubsystemIdFields.vue';
import type { SubsystemId } from '@/types';

const props = defineProps<{
  subsystem: SubsystemId;
  serviceCode: string;
  serviceVersion: string;
  errors: Record<string, string>;
}>();

const emit = defineEmits<{
  'update:subsystem': [value: SubsystemId];
  'update:serviceCode': [value: string];
  'update:serviceVersion': [value: string];
  clear: [];
}>();

const { t } = useI18n();

function updateSubsystemField(field: keyof SubsystemId, value: string): void {
  emit('update:subsystem', {
    ...props.subsystem,
    [field]: value,
  });
}
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-2">
      <v-btn
        size="small"
        variant="tonal"
        color="error"
        @click="emit('clear')"
        :title="t('xroad.service.clear')"
      >
        <v-icon start>delete</v-icon>
        {{ t('entity.action.clear') }}
      </v-btn>
    </div>

    <SubsystemIdFields
      prefix="service"
      id-prefix="service"
      :instance-id="subsystem.instanceId"
      :member-class="subsystem.memberClass"
      :member-code="subsystem.memberCode"
      :subsystem-code="subsystem.subsystemCode"
      :errors="{
        instanceId: errors['service.subsystem.instanceId'] ?? '',
        memberClass: errors['service.subsystem.memberClass'] ?? '',
        memberCode: errors['service.subsystem.memberCode'] ?? '',
        subsystemCode: errors['service.subsystem.subsystemCode'] ?? '',
      }"
      @update:instance-id="updateSubsystemField('instanceId', $event)"
      @update:member-class="updateSubsystemField('memberClass', $event)"
      @update:member-code="updateSubsystemField('memberCode', $event)"
      @update:subsystem-code="updateSubsystemField('subsystemCode', $event)"
    />

    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          id="serviceCode"
          :model-value="serviceCode"
          @update:model-value="emit('update:serviceCode', $event)"
          :label="`${t('xroad.service.serviceCode')} *`"
          :placeholder="t('xroad.placeholders.serviceCode')"
          :error-messages="errors['service.serviceCode']"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          id="serviceVersion"
          :model-value="serviceVersion"
          @update:model-value="emit('update:serviceVersion', $event)"
          :label="t('xroad.service.serviceVersion')"
          :placeholder="t('xroad.placeholders.serviceVersion')"
          :error-messages="errors['service.serviceVersion']"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>
  </div>
</template>
