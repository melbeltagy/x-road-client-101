<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { XRoadError } from "@/types";

defineProps<{
  xroadError?: XRoadError;
}>();

const { t } = useI18n();
</script>

<template>
  <v-alert v-if="xroadError" type="error" variant="tonal" class="mb-4">
    <template #title>
      <strong>{{ t("xroad.response.xroadError") }}</strong>
    </template>

    <div class="mt-2">
      <div>
        <strong>{{ t("xroad.response.xroadErrorType") }}:</strong>
        {{ xroadError.type }}
      </div>
      <div>
        <strong>{{ t("xroad.response.xroadErrorMessage") }}:</strong>
        {{ xroadError.message }}
      </div>
      <div v-if="xroadError.detail">
        <strong>{{ t("xroad.response.xroadErrorDetail") }}:</strong>
        {{ xroadError.detail }}
      </div>
      <div v-if="xroadError.faultCode">
        <strong>{{ t("xroad.response.xroadErrorFaultCode") }}:</strong>
        {{ xroadError.faultCode }}
      </div>
      <div v-if="xroadError.faultString">
        <strong>{{ t("xroad.response.xroadErrorFaultString") }}:</strong>
        {{ xroadError.faultString }}
      </div>
    </div>
  </v-alert>
</template>
