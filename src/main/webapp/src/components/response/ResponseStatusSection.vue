<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toHumanReadableSize } from "@/utils/format";
import { statusColorFor } from "@/utils/http-status";

const props = defineProps<{
  statusCode: number;
  statusText: string;
  timestamp: string;
  contentType?: string;
  contentLength?: number | null;
}>();

const { t } = useI18n();

const statusColor = computed(() => statusColorFor(props.statusCode));

const formattedTimestamp = computed(() => {
  return new Date(props.timestamp).toLocaleString();
});
</script>

<template>
  <v-expansion-panel value="status">
    <v-expansion-panel-title>
      <div class="d-flex align-center">
        <strong>{{ t("xroad.response.responseStatus") }}</strong>
        <v-chip :color="statusColor" size="small" class="ml-2">
          {{ statusCode === 0 ? t("xroad.response.error") : `${statusCode} ${statusText}` }}
        </v-chip>
      </div>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <div class="mb-2">
        <span class="text-caption text-medium-emphasis">{{ t("xroad.response.timestamp") }}:</span>
        {{ formattedTimestamp }}
      </div>
      <div v-if="contentType" class="mb-2">
        <span class="text-caption text-medium-emphasis">{{ t("xroad.response.contentType") }}:</span>
        {{ contentType }}
      </div>
      <div v-if="contentLength != null" class="mb-2">
        <span class="text-caption text-medium-emphasis">{{ t("xroad.response.contentLength") }}:</span>
        {{ toHumanReadableSize(contentLength) }}
      </div>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
