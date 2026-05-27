<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { CertificateType, type MTlsCertificates } from "@/types";
import CertificateUploadModal from "./CertificateUploadModal.vue";
import ClearButton from "@/components/common/ClearButton.vue";

const props = defineProps<{
  certificates: MTlsCertificates;
}>();

const emit = defineEmits<{
  "update:certificates": [value: MTlsCertificates];
}>();

const { t } = useI18n();

const modalState = ref<{
  isOpen: boolean;
  certificateType: CertificateType | null;
  currentValue: string;
}>({
  isOpen: false,
  certificateType: null,
  currentValue: "",
});

const certificateMetadata = computed(() => [
  {
    type: CertificateType.SECURITY_SERVER,
    labelKey: "xroad.certificates.securityServerCert",
    descriptionKey: "xroad.certificates.securityServerCertDescription",
  },
  {
    type: CertificateType.CLIENT_CERT,
    labelKey: "xroad.certificates.clientCert",
    descriptionKey: "xroad.certificates.clientCertDescription",
  },
  {
    type: CertificateType.CLIENT_KEY,
    labelKey: "xroad.certificates.clientPrivateKey",
    descriptionKey: "xroad.certificates.clientPrivateKeyDescription",
  },
]);

function getCertificateValue(type: CertificateType): string | undefined {
  return props.certificates[type];
}

function isConfigured(type: CertificateType): boolean {
  const value = getCertificateValue(type);
  return !!value && value.trim() !== "";
}

function openModal(type: CertificateType): void {
  modalState.value = {
    isOpen: true,
    certificateType: type,
    currentValue: getCertificateValue(type) ?? "",
  };
}

function closeModal(): void {
  modalState.value = {
    isOpen: false,
    certificateType: null,
    currentValue: "",
  };
}

function handleCertificateSave(value: string): void {
  if (modalState.value.certificateType) {
    emit("update:certificates", {
      ...props.certificates,
      [modalState.value.certificateType]: value,
    });
  }
}

function handleCertificateDelete(type: CertificateType): void {
  emit("update:certificates", {
    ...props.certificates,
    [type]: "",
  });
}

function handleClearAll(): void {
  emit("update:certificates", {});
}

const hasAnyCertificate = computed(() => {
  return Object.values(props.certificates).some((v) => v && v.trim() !== "");
});
</script>

<template>
  <div>
    <ClearButton @click="handleClearAll" />

    <div class="text-caption text-medium-emphasis mb-3">
      {{ t("xroad.certificates.description") }}
    </div>

    <v-list lines="two" bg-color="transparent">
      <v-list-item v-for="cert in certificateMetadata" :key="cert.type" class="px-0">
        <v-list-item-title class="font-weight-bold">
          {{ t(cert.labelKey) }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ t(cert.descriptionKey) }}
        </v-list-item-subtitle>

        <template #append>
          <div class="d-flex ga-1">
            <template v-if="isConfigured(cert.type)">
              <v-btn icon size="small" variant="text" color="info" @click="openModal(cert.type)" :title="t('xroad.certificates.view')">
                <v-icon>visibility</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click="handleCertificateDelete(cert.type)"
                :title="t('entity.action.delete')"
              >
                <v-icon>delete</v-icon>
              </v-btn>
            </template>
            <v-btn
              v-else
              icon
              size="small"
              variant="text"
              color="primary"
              @click="openModal(cert.type)"
              :title="t('xroad.certificates.add')"
            >
              <v-icon>add</v-icon>
            </v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </div>

  <CertificateUploadModal
    v-if="modalState.certificateType"
    v-model="modalState.isOpen"
    :certificate-type="modalState.certificateType"
    :current-value="modalState.currentValue"
    @save="handleCertificateSave"
  />
</template>
