<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { MTlsCertificates, XRoadRequest } from "@/types";
import { generateCurlCommand } from "@/utils/curl-generator";
import { buildServiceUrl } from "@/utils/xroad-url";
import { useFormCompleteness } from "@/composables";
import StatusIndicator from "./StatusIndicator.vue";
import SummaryRow from "./SummaryRow.vue";

const props = defineProps<{
  client: {
    subsystem: {
      instanceId?: string;
      memberClass?: string;
      memberCode?: string;
      subsystemCode?: string;
    };
    securityServerUrl?: string;
  };
  service: {
    subsystem: {
      instanceId?: string;
      memberClass?: string;
      memberCode?: string;
      subsystemCode?: string;
    };
    serviceCode?: string;
    serviceVersion?: string;
  };
  requestPath?: string;
  certificates: MTlsCertificates;
  lastRequestSuccess: boolean | null;
  loading: boolean;
  isFormValid: boolean;
  request: XRoadRequest | null;
}>();

const emit = defineEmits<{
  submit: [];
  showAlert: [type: "success" | "error" | "warning", message: string];
  requestImport: [];
}>();

const { t } = useI18n();

const clientHeader = computed(() => {
  const { instanceId, memberClass, memberCode, subsystemCode } = props.client.subsystem;
  // Show partial client identifier as user types
  const parts = [instanceId, memberClass, memberCode, subsystemCode];
  const hasAnyValue = parts.some((p) => p);
  if (!hasAnyValue) {
    return null;
  }
  return parts.map((p) => p || "").join("/");
});

const serviceUrl = computed(() => {
  const { securityServerUrl } = props.client;
  const { instanceId, memberClass, memberCode, subsystemCode } = props.service.subsystem;
  const { serviceCode, serviceVersion } = props.service;
  const path = props.requestPath;

  // Show partial URL as user types
  const hasAnyServiceField = instanceId || memberClass || memberCode || subsystemCode || serviceCode;
  if (!securityServerUrl && !hasAnyServiceField && !path) {
    return null;
  }

  return buildServiceUrl(
    securityServerUrl || "",
    {
      subsystem: {
        instanceId: instanceId || "",
        memberClass: memberClass || "",
        memberCode: memberCode || "",
        subsystemCode: subsystemCode || "",
      },
      serviceCode: serviceCode || "",
      serviceVersion: serviceVersion || undefined,
    },
    path || "",
  );
});

const hasMtls = computed(() => {
  return !!(
    props.certificates.securityServerCert?.trim() &&
    props.certificates.clientCert?.trim() &&
    props.certificates.clientPrivateKey?.trim()
  );
});

const hasHttpsNoAuth = computed(() => {
  return !!props.certificates.securityServerCert?.trim();
});

const {
  securityServerComplete,
  clientComplete: isClientComplete,
  serviceSubsystemComplete,
  serviceCodeComplete,
  pathComplete,
} = useFormCompleteness(() => ({
  client: props.client,
  service: props.service,
  request: { path: props.requestPath },
}));

// Service URL ready: security server + service subsystem + service code + path.
// (Client subsystem is checked separately as isClientComplete.)
const isServiceComplete = computed(
  () => securityServerComplete.value && serviceSubsystemComplete.value && serviceCodeComplete.value && pathComplete.value,
);

interface TileSpec {
  ok: boolean;
  okLabelKey: string;
  failLabelKey: string;
  okColor?: string;
  failColor?: string;
  okIcon?: string;
  failIcon?: string;
}

const tiles = computed<TileSpec[]>(() => [
  {
    ok: hasMtls.value,
    okLabelKey: "xroad.status.mtlsEnabled",
    failLabelKey: "xroad.status.mtlsDisabled",
  },
  {
    ok: hasHttpsNoAuth.value,
    okLabelKey: "xroad.status.httpsNoAuth",
    failLabelKey: "xroad.status.noHttpsCert",
  },
  // Request status is tri-state; encoded as ok=true|false|null elsewhere
]);

const requestStatusIndicator = computed(() => {
  if (props.lastRequestSuccess === null) {
    return { icon: "radio_button_unchecked", color: "grey", label: t("xroad.status.notSent") };
  }
  if (props.lastRequestSuccess) {
    return { icon: "check_circle", color: "success", label: t("xroad.status.success") };
  }
  return { icon: "cancel", color: "error", label: t("xroad.status.error") };
});

// Copy request as cURL command
async function copyAsCurl(): Promise<void> {
  if (!props.request) return;

  try {
    const curlCommand = generateCurlCommand(props.request);
    await navigator.clipboard.writeText(curlCommand);
    emit("showAlert", "success", t("xroad.toast.curlCopied"));
  } catch {
    emit("showAlert", "error", t("xroad.toast.curlCopyFailed"));
  }
}
</script>

<template>
  <v-footer app class="status-panel elevation-4">
    <v-container fluid class="pa-4">
      <SummaryRow :label="t('xroad.status.client')" :value="clientHeader" :incomplete="!isClientComplete" />

      <SummaryRow :label="t('xroad.status.serviceUrl')" :value="serviceUrl" :incomplete="!isServiceComplete" />

      <!-- Indicators and Send Button -->
      <v-row align="center">
        <v-col v-for="(tile, i) in tiles" :key="i" cols="12" md="2">
          <StatusIndicator
            :icon="tile.ok ? 'check_circle' : 'cancel'"
            :color="tile.ok ? 'success' : 'error'"
            :label="t(tile.ok ? tile.okLabelKey : tile.failLabelKey)"
          />
        </v-col>

        <v-col cols="12" md="2">
          <StatusIndicator
            :icon="requestStatusIndicator.icon"
            :color="requestStatusIndicator.color"
            :label="requestStatusIndicator.label"
          />
        </v-col>

        <!-- cURL action group (Import + Export clustered together) -->
        <v-col cols="12" md="4" class="d-flex justify-end align-center ga-2">
          <v-btn variant="outlined" color="primary" size="default" @click="emit('requestImport')">
            <v-icon start>download</v-icon>
            {{ t("xroad.action.importCurl") }}
          </v-btn>
          <v-btn variant="outlined" color="primary" size="default" :disabled="!request || !isServiceComplete" @click="copyAsCurl">
            <v-icon start>content_copy</v-icon>
            {{ t("xroad.action.exportCurl") }}
          </v-btn>
        </v-col>

        <!-- Send Button -->
        <v-col cols="12" md="2" class="text-right">
          <v-btn
            color="primary"
            size="x-large"
            block
            :loading="loading"
            :disabled="loading || !isClientComplete || !isServiceComplete"
            @click="emit('submit')"
          >
            <v-icon v-if="!loading" start>send</v-icon>
            {{ loading ? t("xroad.request.sending") : t("xroad.request.submit") }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<style scoped>
.status-panel {
  border-top: 2px solid rgb(var(--v-theme-primary));
}
</style>
