<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  body?: string;
  contentType?: string;
  effectiveTheme: 'light' | 'dark';
}>();

const { t } = useI18n();

type ViewMode = 'raw' | 'json';
const viewMode = ref<ViewMode>('raw');

function isBodyTooLarge(body?: string): boolean {
  if (!body) return false;
  const sizeInBytes = new Blob([body]).size;
  return sizeInBytes > 1024 * 1024; // 1MB limit
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const parsedJson = computed(() => {
  if (!props.body || isBodyTooLarge(props.body)) return null;
  try {
    return JSON.parse(props.body);
  } catch {
    return null;
  }
});

const isValidJson = computed(() => parsedJson.value !== null);
const bodySize = computed(() => (props.body ? new Blob([props.body]).size : 0));
const bodyTooLarge = computed(() => isBodyTooLarge(props.body));

const formattedJson = computed(() => {
  if (!isValidJson.value) return '';
  return JSON.stringify(parsedJson.value, null, 2);
});

// Auto-select view mode based on JSON validity
watch(
  () => props.body,
  () => {
    if (isValidJson.value && !bodyTooLarge.value) {
      viewMode.value = 'json';
    } else {
      viewMode.value = 'raw';
    }
  },
  { immediate: true }
);

function downloadResponse(): void {
  if (!props.body) return;
  const blob = new Blob([props.body], { type: props.contentType || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xroad-response-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <v-expansion-panel value="body">
    <v-expansion-panel-title>
      <div class="d-flex justify-space-between align-center w-100 pe-2">
        <strong>{{ t('xroad.response.responseBody') }}</strong>
        <div class="d-flex align-center ga-2">
          <!-- Format toggle buttons -->
          <v-btn-toggle
            v-if="body && !bodyTooLarge && isValidJson"
            v-model="viewMode"
            mandatory
            density="compact"
            variant="outlined"
            @click.stop
          >
            <v-btn value="raw" size="small">{{ t('xroad.response.raw') }}</v-btn>
            <v-btn value="json" size="small">{{ t('xroad.response.jsonFormat') }}</v-btn>
          </v-btn-toggle>

          <span v-if="body" class="text-caption text-medium-emphasis">
            {{ t('xroad.response.size') }}: {{ formatBytes(bodySize) }}
            <v-chip v-if="bodyTooLarge" color="warning" size="x-small" class="ml-1">
              {{ t('xroad.response.tooLarge') }}
            </v-chip>
          </span>
        </div>
      </div>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <!-- No body -->
      <div v-if="!body" class="text-medium-emphasis font-italic">
        {{ t('xroad.response.noBody') }}
      </div>

      <!-- Body too large -->
      <div v-else-if="bodyTooLarge">
        <v-alert type="warning" variant="tonal" class="mb-3">
          {{ t('xroad.response.bodyTooLargeMessage') }}
        </v-alert>
        <v-btn color="primary" size="small" @click="downloadResponse">
          {{ t('xroad.response.downloadResponse') }}
        </v-btn>
      </div>

      <!-- JSON view -->
      <div v-else-if="viewMode === 'json' && isValidJson">
        <pre class="response-body-pre" :class="{ 'dark-theme': effectiveTheme === 'dark' }">{{ formattedJson }}</pre>
      </div>

      <!-- Invalid JSON fallback -->
      <div v-else-if="viewMode === 'json' && !isValidJson">
        <v-alert type="warning" variant="tonal" class="mb-3">
          {{ t('xroad.response.invalidJson') }}
        </v-alert>
        <pre class="response-body-pre" :class="{ 'dark-theme': effectiveTheme === 'dark' }">{{ body }}</pre>
      </div>

      <!-- Raw view -->
      <pre v-else class="response-body-pre" :class="{ 'dark-theme': effectiveTheme === 'dark' }">{{ body }}</pre>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<style scoped>
.response-body-pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 0.875rem;
  padding: 1rem;
  border-radius: 4px;
  background-color: #f5f5f5;
  overflow-x: auto;
  margin: 0;
}

.response-body-pre.dark-theme {
  background-color: #2d2d2d;
  color: #f5f5f5;
}
</style>
