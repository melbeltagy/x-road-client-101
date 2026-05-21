<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  statusCode: number;
  statusText: string;
  timestamp: string;
  contentType?: string;
  contentLength?: number | null;
}>();

const { t } = useI18n();
const isOpen = ref(true);

const statusColor = computed(() => {
  if (props.statusCode === 0) return 'error';
  if (props.statusCode >= 200 && props.statusCode < 300) return 'success';
  if (props.statusCode >= 300 && props.statusCode < 400) return 'info';
  if (props.statusCode >= 400 && props.statusCode < 500) return 'warning';
  return 'error';
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const formattedTimestamp = computed(() => {
  return new Date(props.timestamp).toLocaleString();
});
</script>

<template>
  <v-expansion-panel value="status">
    <v-expansion-panel-title>
      <div class="d-flex align-center">
        <strong>{{ t('xroad.response.responseStatus') }}</strong>
        <v-chip
          :color="statusColor"
          size="small"
          class="ml-2"
        >
          {{ statusCode === 0 ? t('xroad.response.error') : `${statusCode} ${statusText}` }}
        </v-chip>
      </div>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <div class="mb-2">
        <span class="text-caption text-medium-emphasis">{{ t('xroad.response.timestamp') }}:</span>
        {{ formattedTimestamp }}
      </div>
      <div v-if="contentType" class="mb-2">
        <span class="text-caption text-medium-emphasis">{{ t('xroad.response.contentType') }}:</span>
        {{ contentType }}
      </div>
      <div v-if="contentLength != null" class="mb-2">
        <span class="text-caption text-medium-emphasis">{{ t('xroad.response.contentLength') }}:</span>
        {{ formatBytes(contentLength) }}
      </div>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
