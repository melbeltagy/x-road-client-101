<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CertificateType } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  certificateType: CertificateType;
  certificateLabel: string;
  certificateDescription: string;
  currentValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [value: string];
}>();

const { t } = useI18n();

const certificateContent = ref(props.currentValue ?? '');
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Update content when props change
watch(
  () => props.currentValue,
  (newValue) => {
    certificateContent.value = newValue ?? '';
  }
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      certificateContent.value = props.currentValue ?? '';
    }
  }
);

function handleSave(): void {
  emit('save', certificateContent.value.trim());
  emit('update:modelValue', false);
}

function handleCancel(): void {
  emit('update:modelValue', false);
}

function handleFileSelect(file: File): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    certificateContent.value = content;
  };
  reader.readAsText(file);
}

function handleFileInputChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    handleFileSelect(file);
  }
}

function handleDragEnter(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = true;
}

function handleDragLeave(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;

  const file = e.dataTransfer?.files?.[0];
  if (file) {
    handleFileSelect(file);
  }
}

function handleBrowseClick(): void {
  fileInput.value?.click();
}

function handleClear(): void {
  certificateContent.value = '';
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="900"
    persistent
  >
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
          <div class="text-subtitle-2 mb-2">{{ t('xroad.certificates.modal.upload') }}</div>
          <div
            :class="[
              'border rounded pa-4 text-center dropzone',
              isDragging ? 'border-primary bg-primary-lighten-5' : 'border-secondary'
            ]"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @dragover="handleDragOver"
            @drop="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".pem,.crt,.key,.cert"
              class="d-none"
              @change="handleFileInputChange"
            />
            <div v-if="isDragging" class="text-primary">
              {{ t('xroad.certificates.modal.dropHere') }}
            </div>
            <div v-else>
              <p class="mb-2">{{ t('xroad.certificates.modal.dragDrop') }}</p>
              <v-btn variant="outlined" size="small" @click="handleBrowseClick">
                {{ t('xroad.certificates.modal.browse') }}
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Manual Entry Section -->
        <div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-subtitle-2">{{ t('xroad.certificates.modal.manualEntry') }}</span>
            <v-btn
              v-if="certificateContent"
              variant="text"
              size="small"
              color="error"
              @click="handleClear"
            >
              {{ t('xroad.certificates.modal.clear') }}
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
            {{ t('xroad.certificates.modal.pemFormat') }}
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ t('entity.action.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!certificateContent.trim()"
          @click="handleSave"
        >
          {{ t('entity.action.save') }}
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
