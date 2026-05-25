<script setup lang="ts">
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    color?: string;
  }>(),
  {
    title: undefined,
    confirmLabel: undefined,
    cancelLabel: undefined,
    color: 'primary',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();

function handleCancel(): void {
  emit('cancel');
  emit('update:modelValue', false);
}

function handleConfirm(): void {
  emit('confirm');
  emit('update:modelValue', false);
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card>
      <v-card-title v-if="title">{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ cancelLabel ?? t('entity.action.cancel') }}
        </v-btn>
        <v-btn :color="color" variant="flat" @click="handleConfirm">
          {{ confirmLabel ?? t('entity.action.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
