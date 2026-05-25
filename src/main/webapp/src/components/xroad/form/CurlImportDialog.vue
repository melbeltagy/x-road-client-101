<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { parseCurlCommand, type ParseCurlResult } from '@/utils/curl-parser';
import type { XRoadRequest } from '@/types';

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

// Three-segment split (before / bad / after) used by the highlight
// overlay to position the dotted underline beneath the offending range.
interface HighlightSegments {
  before: string;
  bad: string;
  after: string;
}

const highlightSegments = computed<HighlightSegments | null>(() => {
  const span = parseResult.value?.errorSpan;
  if (!span || !curlText.value) return null;
  const text = curlText.value;
  const start = Math.max(0, Math.min(span.start, text.length));
  const end = Math.max(start, Math.min(span.end, text.length));
  if (end === start) return null;
  return {
    before: text.slice(0, start),
    bad: text.slice(start, end),
    after: text.slice(end),
  };
});

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

        <!-- Textarea + highlight overlay. The textarea text is the
             visible layer; the overlay (positioned absolutely on top,
             pointer-events disabled) carries transparent text plus a
             dotted underline on the offending range. -->
        <div class="curl-input-wrapper">
          <v-textarea
            v-model="curlText"
            rows="12"
            variant="outlined"
            :placeholder="PLACEHOLDER_CURL"
            class="font-monospace curl-textarea"
            hide-details
            autofocus
          />
          <div
            v-if="highlightSegments"
            class="font-monospace curl-overlay"
            aria-hidden="true"
          ><span class="overlay-invisible">{{ highlightSegments.before }}</span><span class="overlay-bad">{{ highlightSegments.bad }}</span><span class="overlay-invisible">{{ highlightSegments.after }}</span></div>
        </div>

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

<style scoped>
.font-monospace {
  font-family: monospace;
}

/* Stacking context for textarea + overlay. */
.curl-input-wrapper {
  position: relative;
}

/* Textarea text is the visible layer — keep its color, but make the
   field background transparent enough for the overlay's underline to
   show through. */
.curl-textarea :deep(textarea) {
  position: relative;
  z-index: 2;
  background: transparent;
}

/* Overlay aligned to the textarea's text box. Vuetify's outlined
   v-textarea applies ~16px horizontal and ~14px vertical padding to
   the inner <textarea>; the values below are tuned to match so the
   underline lines up beneath the corresponding characters. */
.curl-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 14px 16px;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  pointer-events: none;
  line-height: 1.5;
  font-size: 1rem;
}

.overlay-invisible {
  color: transparent;
}

/* Offending range: transparent text (textarea renders the visible
   characters), plus the dotted underline. */
.overlay-bad {
  color: transparent;
  border-bottom: 2px dotted rgb(var(--v-theme-error));
}
</style>
