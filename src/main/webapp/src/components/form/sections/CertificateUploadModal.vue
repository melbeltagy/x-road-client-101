<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { CertificateType } from "@/types";
import { useFileDrop } from "@/composables";

const props = defineProps<{
  modelValue: boolean;
  certificateType: CertificateType;
  currentValue?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [value: string];
}>();

const { t } = useI18n();

const certificateContent = ref(props.currentValue ?? "");

// Reset the textarea to the current persisted cert value whenever the
// modal opens. Re-using the same watcher for currentValue would only
// matter if the parent mutated currentValue while the modal was open,
// which it doesn't — the parent freezes that prop until the modal closes.
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      certificateContent.value = props.currentValue ?? "";
    }
  },
);

const { isDragging, fileInputRef, onFileInputChange, onDragEnter, onDragLeave, onDragOver, onDrop, openPicker } = useFileDrop((content) => {
  certificateContent.value = content;
});

function handleSave(): void {
  emit("save", certificateContent.value.trim());
  emit("update:modelValue", false);
}

function handleCancel(): void {
  emit("update:modelValue", false);
}

function handleClear(): void {
  certificateContent.value = "";
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="900" persistent @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ t(`xroad.certificates.modal.title.${certificateType}`) }}</span>
        <v-btn icon variant="text" @click="handleCancel">
          <v-icon>close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <p class="text-medium-emphasis mb-4">
          {{ t(`xroad.certificates.modal.description.${certificateType}`) }}
        </p>

        <!-- Upload Section -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">{{ t("xroad.certificates.modal.upload") }}</div>
          <div
            :class="['border rounded pa-4 text-center dropzone', isDragging ? 'border-primary bg-primary-lighten-5' : 'border-secondary']"
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
            @dragover="onDragOver"
            @drop="onDrop"
          >
            <input ref="fileInputRef" type="file" accept=".pem,.crt,.key,.cert" class="d-none" @change="onFileInputChange" />
            <div v-if="isDragging" class="text-primary">
              {{ t("xroad.certificates.modal.dropHere") }}
            </div>
            <div v-else>
              <p class="mb-2">{{ t("xroad.certificates.modal.dragDrop") }}</p>
              <v-btn variant="outlined" size="small" @click="openPicker">
                {{ t("xroad.certificates.modal.browse") }}
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Manual Entry Section -->
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-subtitle-2">{{ t("xroad.certificates.modal.manualEntry") }}</span>
            <v-btn v-if="certificateContent" variant="text" size="small" color="error" @click="handleClear">
              {{ t("xroad.certificates.modal.clear") }}
            </v-btn>
          </div>
          <v-textarea
            v-model="certificateContent"
            rows="10"
            variant="outlined"
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            class="font-monospace"
          />
          <div class="text-caption text-medium-emphasis">
            {{ t("xroad.certificates.modal.pemFormat") }}
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ t("entity.action.cancel") }}
        </v-btn>
        <v-btn color="primary" variant="flat" :disabled="!certificateContent.trim()" @click="handleSave">
          {{ t("entity.action.save") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dropzone {
  min-height: 100px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.dropzone:hover {
  border-color: rgb(var(--v-theme-primary));
}

.font-monospace {
  font-family: monospace;
}
</style>
