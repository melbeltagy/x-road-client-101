<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SubsystemIdFields from './SubsystemIdFields.vue';
import { fetchServices } from '@/services/security-server.service';
import type { SubsystemId, ServiceInfo } from '@/types';

const props = defineProps<{
  subsystem: SubsystemId;
  serviceCode: string;
  serviceVersion: string;
  errors: Record<string, string>;
  suggestions?: SubsystemId[];
  clientSubsystem?: SubsystemId;
  securityServerUrl?: string;
}>();

const emit = defineEmits<{
  'update:subsystem': [value: SubsystemId];
  'update:serviceCode': [value: string];
  'update:serviceVersion': [value: string];
  'update:availableServices': [services: ServiceInfo[]];
  'update:isLoadingServices': [value: boolean];
  'update:servicesError': [value: string | null];
  clear: [];
}>();

const { t } = useI18n();

// State for fetched services
const availableServices = ref<ServiceInfo[]>([]);
const isLoadingServices = ref(false);
const servicesError = ref<string | null>(null);

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Check if subsystem is complete
const isSubsystemComplete = computed(() => {
  return (
    props.subsystem.instanceId &&
    props.subsystem.memberClass &&
    props.subsystem.memberCode &&
    props.subsystem.subsystemCode
  );
});

// Check if client is complete
const isClientComplete = computed(() => {
  return (
    props.clientSubsystem?.instanceId &&
    props.clientSubsystem?.memberClass &&
    props.clientSubsystem?.memberCode &&
    props.clientSubsystem?.subsystemCode
  );
});

// Compute service code options
const serviceCodeOptions = computed(() => {
  return availableServices.value.map((s) => ({
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

// Fetch services when subsystem is complete
async function loadServices(): Promise<void> {
  if (!props.securityServerUrl || !isClientComplete.value || !isSubsystemComplete.value) {
    availableServices.value = [];
    servicesError.value = null;
    emit('update:availableServices', []);
    emit('update:servicesError', null);
    return;
  }

  isLoadingServices.value = true;
  servicesError.value = null;
  emit('update:isLoadingServices', true);
  emit('update:servicesError', null);

  try {
    const services = await fetchServices(
      props.securityServerUrl,
      props.clientSubsystem!,
      props.subsystem
    );
    availableServices.value = services;
    emit('update:availableServices', services);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    servicesError.value = t('xroad.service.fetchError');
    availableServices.value = [];
    emit('update:availableServices', []);
    emit('update:servicesError', servicesError.value);
  } finally {
    isLoadingServices.value = false;
    emit('update:isLoadingServices', false);
  }
}

// Watch for subsystem changes with debounce
watch(
  [() => props.subsystem, () => props.clientSubsystem, () => props.securityServerUrl],
  () => {
    // Clear immediately when fields change
    availableServices.value = [];
    servicesError.value = null;
    emit('update:availableServices', []);
    emit('update:servicesError', null);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      loadServices();
    }, 500);
  },
  { deep: true }
);

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
          @update:model-value="handleServiceCodeUpdate"
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
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps">
              <template #subtitle>
                <span class="text-caption">{{ (item as any).raw?.subtitle }}</span>
              </template>
            </v-list-item>
          </template>
        </v-combobox>
        <v-text-field
          v-else
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
