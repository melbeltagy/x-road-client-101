<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
  /** Hover tooltip text. */
  title?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="d-flex justify-end mb-2">
    <v-btn
      size="small"
      variant="tonal"
      color="error"
      :title="title"
      @click="emit('click')"
    >
      <v-icon start>delete</v-icon>
      {{ t('entity.action.clear') }}
    </v-btn>
  </div>
</template>
