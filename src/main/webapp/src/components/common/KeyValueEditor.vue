<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { KeyValuePair } from "@/composables";

const props = withDefaults(
  defineProps<{
    titleKey?: string;
    items: KeyValuePair[];
    keyPlaceholderKey: string;
    valuePlaceholderKey: string;
    emptyMessageKey: string;
    showTitle?: boolean;
  }>(),
  {
    titleKey: "",
    showTitle: true,
  },
);

const emit = defineEmits<{
  add: [];
  remove: [index: number];
  update: [index: number, field: "key" | "value", value: string];
  clear: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="mb-4">
    <div class="d-flex justify-space-between align-center mb-2">
      <span v-if="showTitle && titleKey" class="text-subtitle-2">{{ t(titleKey) }}</span>
      <span v-else></span>
      <div class="d-flex ga-2">
        <v-btn size="small" variant="outlined" color="primary" @click="emit('add')">
          <v-icon start>add</v-icon>
          {{ t("entity.action.add") }}
        </v-btn>
        <v-btn size="small" variant="tonal" color="error" @click="emit('clear')">
          <v-icon start>delete</v-icon>
          {{ t("entity.action.clear") }}
        </v-btn>
      </div>
    </div>

    <div v-if="items.length === 0" class="text-caption text-medium-emphasis">
      {{ t(emptyMessageKey) }}
    </div>

    <v-row v-for="(item, index) in items" :key="item.id" class="mb-1" no-gutters>
      <v-col cols="5">
        <v-text-field
          :model-value="item.key"
          @update:model-value="emit('update', index, 'key', $event)"
          :placeholder="t(keyPlaceholderKey)"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="5" class="px-2">
        <v-text-field
          :model-value="item.value"
          @update:model-value="emit('update', index, 'value', $event)"
          :placeholder="t(valuePlaceholderKey)"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="2">
        <v-btn icon size="small" variant="outlined" color="error" @click="emit('remove', index)">
          <v-icon>delete</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>
