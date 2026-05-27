<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  label: string;
  value: string | null;
  incomplete: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <v-row class="mb-2">
    <v-col>
      <div class="d-flex align-center">
        <strong class="text-h6 mr-3" style="min-width: 150px">{{ label }}:</strong>
        <template v-if="value">
          <v-icon v-if="incomplete" color="warning" size="small" class="mr-1">warning</v-icon>
          <span class="text-h5 font-monospace text-break" :class="{ 'text-warning': incomplete }">{{ value }}</span>
        </template>
        <span v-else class="text-medium-emphasis">{{ t("xroad.status.notConfigured") }}</span>
      </div>
    </v-col>
  </v-row>
</template>

<style scoped>
.font-monospace {
  font-family: monospace;
}

.text-break {
  word-break: break-all;
}
</style>
