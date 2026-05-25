<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import CurlImportDialog from './CurlImportDialog.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import type { XRoadRequest } from '@/types';

defineProps<{
  importOpen: boolean;
  replaceConfirmOpen: boolean;
}>();

const emit = defineEmits<{
  'update:importOpen': [value: boolean];
  'update:replaceConfirmOpen': [value: boolean];
  import: [payload: { request: XRoadRequest; warnings: string[] }];
  confirmReplace: [];
  cancelReplace: [];
}>();

const { t } = useI18n();
</script>

<template>
  <!-- cURL Import Dialog -->
  <CurlImportDialog
    :model-value="importOpen"
    @update:model-value="emit('update:importOpen', $event)"
    @import="emit('import', $event)"
  />

  <!-- Confirm: replace existing form data on import -->
  <ConfirmDialog
    :model-value="replaceConfirmOpen"
    @update:model-value="emit('update:replaceConfirmOpen', $event)"
    :message="t('xroad.curlImport.confirmReplace')"
    color="warning"
    @confirm="emit('confirmReplace')"
    @cancel="emit('cancelReplace')"
  />
</template>
