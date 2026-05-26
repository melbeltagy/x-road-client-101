<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '@/stores/theme';
import type { XRoadResponse } from '@/types';
import ResponseStatusSection from './ResponseStatusSection.vue';
import CollapsibleHeadersSection from './CollapsibleHeadersSection.vue';
import ResponseXRoadErrorSection from './ResponseXRoadErrorSection.vue';
import ResponseBodySection from './ResponseBodySection.vue';

const props = defineProps<{
  response: XRoadResponse | null;
}>();

const { t } = useI18n();
const themeStore = useThemeStore();

// Default open panels
const openPanels = ref(['status', 'xroad-headers', 'body']);

// Helper function to expand multi-value HTTP headers into multiple key-value pairs
function expandHeaders(headers: Record<string, string[]>): Record<string, string> {
  const expanded: Record<string, string> = {};

  Object.entries(headers).forEach(([key, values]) => {
    if (values.length === 0) {
      return;
    }

    if (values.length === 1) {
      expanded[key] = values[0];
    } else {
      values.forEach((value, index) => {
        expanded[`${key}[${index}]`] = value;
      });
    }
  });

  return expanded;
}

// Sort object keys alphabetically
function sortByKeys(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .reduce((sorted, key) => {
      sorted[key] = obj[key];
      return sorted;
    }, {} as Record<string, string>);
}

const xroadHeaders = computed((): Record<string, string> => {
  if (!props.response?.headers) return {};

  const result: Record<string, string> = {};
  Object.entries(props.response.headers).forEach(([key, values]) => {
    if (key.toLowerCase().startsWith('x-road')) {
      if (values.length === 1) {
        result[key] = values[0];
      } else if (values.length > 1) {
        values.forEach((value, index) => {
          result[`${key}[${index}]`] = value;
        });
      }
    }
  });
  return sortByKeys(result);
});

const httpHeaders = computed(() => {
  if (!props.response?.headers) return {};

  // Filter out X-Road headers
  const filtered: Record<string, string[]> = {};
  Object.entries(props.response.headers).forEach(([key, values]) => {
    if (!key.toLowerCase().startsWith('x-road')) {
      filtered[key] = values;
    }
  });

  return sortByKeys(expandHeaders(filtered));
});
</script>

<template>
  <div class="xroad-response-viewer">
    <!-- No response state -->
    <v-alert v-if="!response" type="info" variant="tonal">
      {{ t('xroad.response.noResponse') }}
    </v-alert>

    <!-- Response viewer -->
    <template v-else>
      <!-- X-Road Error (shown outside expansion panels) -->
      <ResponseXRoadErrorSection :xroad-error="response.xroadError" />

      <v-expansion-panels v-model="openPanels" multiple>
        <!-- Response Status -->
        <ResponseStatusSection
          :status-code="response.statusCode"
          :status-text="response.statusText"
          :timestamp="response.timestamp"
          :content-type="response.contentType"
          :content-length="response.contentLength"
        />

        <!-- Response Body -->
        <ResponseBodySection
          :body="response.body"
          :content-type="response.contentType"
          :effective-theme="themeStore.effectiveTheme"
        />

        <!-- X-Road Headers -->
        <CollapsibleHeadersSection
          title-key="xroad.response.xroadHeaders"
          :headers="xroadHeaders"
          panel-value="xroad-headers"
          :default-open="true"
        />

        <!-- HTTP Headers (excluding X-Road headers) -->
        <CollapsibleHeadersSection
          title-key="xroad.response.httpHeaders"
          :headers="httpHeaders"
          panel-value="http-headers"
          :default-open="false"
          empty-message-key="xroad.response.noHeaders"
        />
      </v-expansion-panels>
    </template>
  </div>
</template>
