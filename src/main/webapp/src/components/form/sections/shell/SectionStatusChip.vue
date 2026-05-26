<script setup lang="ts">
/**
 * Status indicator for a form section's accordion title: a small
 * progress spinner while loading, a success chip when a count is
 * available, or a warning chip when an error message is present.
 * Also accepts an optional "info" fallback chip (used by the endpoint
 * section's "service not found" hint).
 *
 * Rules of precedence (top-to-bottom): loading > success > error > info.
 * If none apply, nothing is rendered.
 */
defineProps<{
  loading: boolean;
  successCount?: number;
  successText?: string;
  error?: string | null;
  infoText?: string | null;
}>();
</script>

<template>
  <v-progress-circular
    v-if="loading"
    indeterminate
    size="16"
    width="2"
    color="primary"
    class="ml-2"
  />
  <v-chip
    v-else-if="successCount && successCount > 0 && successText"
    size="small"
    color="success"
    variant="tonal"
    class="ml-2"
  >
    {{ successText }}
  </v-chip>
  <v-chip
    v-else-if="error"
    size="small"
    color="warning"
    variant="tonal"
    class="ml-2"
  >
    {{ error }}
  </v-chip>
  <v-chip
    v-else-if="infoText"
    size="small"
    color="info"
    variant="tonal"
    class="ml-2"
  >
    {{ infoText }}
  </v-chip>
</template>
