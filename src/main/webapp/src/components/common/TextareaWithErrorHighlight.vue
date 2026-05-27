<script setup lang="ts">
import { computed } from "vue";

interface ErrorSpan {
  start: number;
  end: number;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    errorSpan?: ErrorSpan | null;
    placeholder?: string;
    rows?: number | string;
    autofocus?: boolean;
  }>(),
  {
    errorSpan: null,
    placeholder: "",
    rows: 12,
    autofocus: false,
  },
);

defineEmits<{
  "update:modelValue": [value: string];
}>();

// Three-segment split (before / bad / after) used by the highlight
// overlay to position the dotted underline beneath the offending range.
const highlightSegments = computed(() => {
  const span = props.errorSpan;
  if (!span || !props.modelValue) return null;
  const text = props.modelValue;
  const start = Math.max(0, Math.min(span.start, text.length));
  const end = Math.max(start, Math.min(span.end, text.length));
  if (end === start) return null;
  return {
    before: text.slice(0, start),
    bad: text.slice(start, end),
    after: text.slice(end),
  };
});
</script>

<template>
  <!-- Textarea text is the visible layer; the overlay (positioned
       absolutely on top, pointer-events disabled) carries transparent
       text plus a dotted underline on the offending range. -->
  <div class="highlight-wrapper">
    <v-textarea
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :rows="rows"
      variant="outlined"
      :placeholder="placeholder"
      class="font-monospace highlight-textarea"
      hide-details
      :autofocus="autofocus"
    />
    <div v-if="highlightSegments" class="font-monospace highlight-overlay" aria-hidden="true">
      <span class="overlay-invisible">{{ highlightSegments.before }}</span
      ><span class="overlay-bad">{{ highlightSegments.bad }}</span
      ><span class="overlay-invisible">{{ highlightSegments.after }}</span>
    </div>
  </div>
</template>

<style scoped>
.font-monospace {
  font-family: monospace;
}

/* Stacking context for textarea + overlay. */
.highlight-wrapper {
  position: relative;
}

/* Textarea text is the visible layer — keep its color, but make the
   field background transparent enough for the overlay's underline to
   show through. */
.highlight-textarea :deep(textarea) {
  position: relative;
  z-index: 2;
  background: transparent;
}

/* Overlay aligned to the textarea's text box. Vuetify's outlined
   v-textarea applies ~16px horizontal and ~14px vertical padding to
   the inner <textarea>; the values below are tuned to match so the
   underline lines up beneath the corresponding characters. */
.highlight-overlay {
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
