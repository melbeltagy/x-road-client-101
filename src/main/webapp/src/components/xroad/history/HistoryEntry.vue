<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RequestHistoryEntry } from '@/stores/xroad-history';

const props = defineProps<{
  entry: RequestHistoryEntry;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  view: [entry: RequestHistoryEntry];
  delete: [entryId: string];
}>();

const { t } = useI18n();

function getStatusColor(statusCode: number): string {
  if (statusCode === 0) return 'error';
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 300 && statusCode < 400) return 'info';
  if (statusCode >= 400 && statusCode < 500) return 'warning';
  return 'error';
}

const formattedTimestamp = computed(() => {
  return new Date(props.entry.timestamp).toLocaleString();
});

const clientIdentifier = computed(() => {
  const { client } = props.entry.request;
  const { instanceId, memberClass, memberCode, subsystemCode } = client.subsystem;
  return `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}`;
});

const serviceUrl = computed(() => {
  const { client, service, request } = props.entry.request;
  const { securityServerUrl } = client;
  const { instanceId, memberClass, memberCode, subsystemCode } = service.subsystem;
  const { serviceCode, serviceVersion } = service;

  const serviceId = serviceVersion
    ? `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}/${serviceCode}/${serviceVersion}`
    : `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}/${serviceCode}`;

  return `${securityServerUrl}/r1/${serviceId}${request.path}`;
});

function handleView(): void {
  emit('view', props.entry);
}

function handleDelete(event: Event): void {
  event.stopPropagation();
  emit('delete', props.entry.id);
}
</script>

<template>
  <v-list-item
    :active="isSelected"
    :value="entry.id"
    @click="handleView"
    class="history-entry"
  >
    <template #prepend>
      <v-chip
        v-if="entry.response"
        :color="getStatusColor(entry.response.statusCode)"
        size="small"
        class="mr-2"
      >
        {{ entry.response.statusCode }}
      </v-chip>
    </template>

    <v-list-item-title class="font-weight-bold">
      <span class="text-caption text-medium-emphasis">Client:</span>
      {{ clientIdentifier }}
    </v-list-item-title>

    <v-list-item-subtitle>
      <div class="mb-1">
        <span class="text-caption text-medium-emphasis">Method:</span>
        <strong class="ml-1">{{ entry.request.request.method }}</strong>
      </div>
      <div class="text-caption d-flex align-center mb-1">
        <v-icon size="small" class="mr-1">schedule</v-icon>
        {{ formattedTimestamp }}
      </div>
      <div class="text-caption font-monospace text-truncate" style="max-width: 300px;">
        {{ serviceUrl }}
      </div>
    </v-list-item-subtitle>

    <template #append>
      <v-btn
        icon
        size="small"
        variant="text"
        color="error"
        @click="handleDelete"
        :title="t('xroad.history.delete')"
      >
        <v-icon>delete</v-icon>
      </v-btn>
    </template>
  </v-list-item>
</template>

<style scoped>
.history-entry {
  cursor: pointer;
}
</style>
