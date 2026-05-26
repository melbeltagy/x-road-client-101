<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { parseCurlCommand, type ParseCurlResult } from '@/utils/curl-parser';
import type { XRoadRequest } from '@/types';
import TextareaWithErrorHighlight from '@/components/common/TextareaWithErrorHighlight.vue';

// Illustrative cURL example shown as the textarea placeholder. Kept
// out of i18n because: (a) it's a code sample, not natural language,
// and (b) the JSON body's braces collide with vue-i18n's interpolation
// syntax ({...}) and need escape gymnastics to live in message files.
const PLACEHOLDER_CURL = [
  "curl -v -X POST \\",
  "  'https://security-server.example.com/r1/INSTANCE/CLASS/MEMBER/SUBSYSTEM/serviceCode/v1/api/path?key=value' \\",
  "  -H 'X-Road-Client: INSTANCE/CLASS/MEMBER/SUBSYSTEM' \\",
  "  -H 'Content-Type: application/json' \\",
  "  -d '{\"field\": \"value\"}' \\",
  "  --cert client-cert.pem \\",
  "  --key client-key.pem \\",
  "  --cacert server-cert.pem",
].join('\n');

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  import: [payload: { request: XRoadRequest; warnings: string[] }];
}>();

const { t } = useI18n();

const curlText = ref('');
const parseResult = ref<ParseCurlResult | null>(null);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      curlText.value = '';
      parseResult.value = null;
    }
  }
);

// Run parser on every change. Pure function, fast (<1ms typical), no
// need to debounce.
watch(curlText, (text) => {
  if (!text.trim()) {
    parseResult.value = null;
    return;
  }
  parseResult.value = parseCurlCommand(text);
});

const canImport = computed(
  () => !!parseResult.value && parseResult.value.request !== null && !parseResult.value.error
);

const error = computed(() => parseResult.value?.error ?? null);
const warnings = computed(() => parseResult.value?.warnings ?? []);
const errorSpan = computed(() => parseResult.value?.errorSpan ?? null);

function handleCancel(): void {
  emit('update:modelValue', false);
}

function handleImport(): void {
  if (!canImport.value || !parseResult.value?.request) return;
  emit('import', { request: parseResult.value.request, warnings: parseResult.value.warnings });
  emit('update:modelValue', false);
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
        <span>{{ t('xroad.curlImport.title') }}</span>
        <v-btn icon variant="text" @click="handleCancel">
          <v-icon>close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <p class="text-medium-emphasis mb-4">
          {{ t('xroad.curlImport.description') }}
        </p>

        <TextareaWithErrorHighlight
          v-model="curlText"
          :error-span="errorSpan"
          :placeholder="PLACEHOLDER_CURL"
          autofocus
        />

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-for="(w, idx) in warnings"
          :key="idx"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ w }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ t('entity.action.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!canImport"
          @click="handleImport"
        >
          <v-icon start>download</v-icon>
          {{ t('xroad.curlImport.importButton') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
