<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SubsystemIdFields from '../subsystem/SubsystemIdFields.vue';
import ClearButton from '@/components/common/ClearButton.vue';
import type { SubsystemId, ServiceInfo } from '@/types';
import { rawOf } from '@/utils/vuetify-slot';

const props = defineProps<{
  subsystem: SubsystemId;
  serviceCode: string;
  serviceVersion: string;
  errors: Record<string, string>;
  suggestions?: SubsystemId[];
  availableServices?: ServiceInfo[];
}>();

const emit = defineEmits<{
  'update:subsystem': [value: SubsystemId];
  'update:serviceCode': [value: string];
  'update:serviceVersion': [value: string];
  clear: [];
}>();

const { t } = useI18n();

interface ServiceCodeOption {
  title: string;
  subtitle: string;
  value: string;
}

// Compute service code options
const serviceCodeOptions = computed<ServiceCodeOption[]>(() => {
  return (props.availableServices ?? []).map((s) => ({
    title: s.serviceCode,
    subtitle: s.serviceType,
    value: s.serviceCode,
  }));
});

// Handle service code selection - extract string value from object if needed
function handleServiceCodeUpdate(value: string | { value: string } | null): void {
  if (value === null) {
    emit('update:serviceCode', '');
  } else if (typeof value === 'string') {
    emit('update:serviceCode', value);
  } else if (typeof value === 'object' && 'value' in value) {
    emit('update:serviceCode', value.value);
  }
}

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
    <ClearButton :title="t('xroad.service.clear')" @click="emit('clear')" />

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
      :suggestions="suggestions"
      @update:instance-id="updateSubsystemField('instanceId', $event)"
      @update:member-class="updateSubsystemField('memberClass', $event)"
      @update:member-code="updateSubsystemField('memberCode', $event)"
      @update:subsystem-code="updateSubsystemField('subsystemCode', $event)"
      @select="handleSubsystemSelect"
    />

    <v-row>
      <v-col cols="12" md="6">
        <v-combobox
          v-if="serviceCodeOptions.length > 0"
          id="serviceCode"
          :model-value="serviceCode"
          :items="serviceCodeOptions"
          item-title="title"
          item-value="value"
          :label="`${t('xroad.service.serviceCode')} *`"
          :placeholder="t('xroad.placeholders.serviceCode')"
          :error-messages="errors['service.serviceCode']"
          variant="outlined"
          density="comfortable"
          clearable
          :menu-props="{ maxHeight: 200 }"
          @update:model-value="handleServiceCodeUpdate"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps">
              <template #subtitle>
                <span class="text-caption">{{ rawOf<ServiceCodeOption>(item).raw?.subtitle }}</span>
              </template>
            </v-list-item>
          </template>
        </v-combobox>
        <v-text-field
          v-else
          id="serviceCode"
          :model-value="serviceCode"
          :label="`${t('xroad.service.serviceCode')} *`"
          :placeholder="t('xroad.placeholders.serviceCode')"
          :error-messages="errors['service.serviceCode']"
          variant="outlined"
          density="comfortable"
          @update:model-value="emit('update:serviceCode', $event)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          id="serviceVersion"
          :model-value="serviceVersion"
          :label="t('xroad.service.serviceVersion')"
          :placeholder="t('xroad.placeholders.serviceVersion')"
          :error-messages="errors['service.serviceVersion']"
          variant="outlined"
          density="comfortable"
          @update:model-value="emit('update:serviceVersion', $event)"
        />
      </v-col>
    </v-row>
  </div>
</template>
