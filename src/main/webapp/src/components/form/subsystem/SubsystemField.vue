<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  id?: string;
  modelValue: string;
  label: string;
  placeholder?: string;
  errorMessage?: string;
  /** Non-empty array switches the input to a combobox with these suggestions. */
  items?: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isCombobox = computed(() => (props.items?.length ?? 0) > 0);
</script>

<template>
  <v-combobox
    v-if="isCombobox"
    :id="id"
    :model-value="modelValue"
    :items="items"
    :label="label"
    :placeholder="placeholder"
    :error-messages="errorMessage"
    variant="outlined"
    density="comfortable"
    clearable
    :menu-props="{ maxHeight: 200 }"
    @update:model-value="emit('update:modelValue', $event ?? '')"
  />
  <v-text-field
    v-else
    :id="id"
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :error-messages="errorMessage"
    variant="outlined"
    density="comfortable"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
