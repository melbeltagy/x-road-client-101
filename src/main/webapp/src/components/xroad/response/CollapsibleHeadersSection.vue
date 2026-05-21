<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  titleKey: string;
  headers: Record<string, string>;
  panelValue: string;
  defaultOpen?: boolean;
  emptyMessageKey?: string;
}>();

const { t } = useI18n();

// Filter out empty values
const validHeaders = computed(() => {
  return Object.entries(props.headers).filter(([, value]) => value && value.trim() !== '');
});

const hasHeaders = computed(() => validHeaders.value.length > 0);
</script>

<template>
  <v-expansion-panel v-if="hasHeaders" :value="panelValue">
    <v-expansion-panel-title>
      <strong>{{ t(titleKey) }}</strong>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <div v-if="validHeaders.length === 0 && emptyMessageKey" class="text-caption text-medium-emphasis font-italic">
        {{ t(emptyMessageKey) }}
      </div>
      <div v-else>
        <div v-for="[key, value] in validHeaders" :key="key" class="mb-2">
          <span class="text-caption text-medium-emphasis">{{ key }}:</span>
          <code class="ml-1">{{ value }}</code>
        </div>
      </div>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
