<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ServiceEndpoint } from '@/types';

const props = defineProps<{
  method: string;
  path: string;
  body: string;
  contentType: string;
  errors: Record<string, string>;
  endpoints?: ServiceEndpoint[];
}>();

const emit = defineEmits<{
  'update:method': [value: string];
  'update:path': [value: string];
  'update:body': [value: string];
  'update:contentType': [value: string];
  clear: [];
}>();

const { t } = useI18n();

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const contentTypes = computed(() => [
  { title: t('xroad.form.selectPlaceholder'), value: '' },
  { title: 'application/json', value: 'application/json' },
  { title: 'application/xml', value: 'application/xml' },
  { title: 'text/plain', value: 'text/plain' },
  { title: 'text/xml', value: 'text/xml' },
  { title: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
]);

const showContentType = computed(() => {
  return props.body && props.body.trim() !== '';
});

// Check if we have endpoint suggestions
const hasEndpoints = computed(() => (props.endpoints?.length ?? 0) > 0);

// Format endpoints for display
const endpointOptions = computed(() => {
  if (!props.endpoints?.length) return [];
  return props.endpoints.map((ep) => ({
    title: `${ep.method} ${ep.path}`,
    method: ep.method,
    path: ep.path,
  }));
});

// Handle endpoint selection
function handleEndpointSelect(selected: string | null): void {
  if (!selected) return;

  const endpoint = endpointOptions.value.find((ep) => ep.title === selected);
  if (endpoint) {
    emit('update:method', endpoint.method);
    emit('update:path', endpoint.path);
  }
}

// Computed for the combined endpoint display value
const selectedEndpoint = computed(() => {
  if (!props.method || !props.path) return null;
  return `${props.method} ${props.path}`;
});
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-2">
      <v-btn
        size="small"
        variant="tonal"
        color="error"
        @click="emit('clear')"
        :title="t('xroad.request.clear')"
      >
        <v-icon start>delete</v-icon>
        {{ t('entity.action.clear') }}
      </v-btn>
    </div>

    <!-- Endpoint selector when suggestions available -->
    <v-autocomplete
      v-if="hasEndpoints"
      :model-value="selectedEndpoint"
      @update:model-value="handleEndpointSelect"
      :items="endpointOptions"
      item-title="title"
      item-value="title"
      :label="t('xroad.request.selectEndpoint')"
      :placeholder="t('xroad.request.selectEndpointPlaceholder')"
      variant="outlined"
      density="comfortable"
      clearable
      class="mb-4"
      prepend-inner-icon="api"
      :menu-props="{ maxHeight: 300 }"
    >
      <template #item="{ props: itemProps, item }">
        <v-list-item v-bind="itemProps">
          <template #prepend>
            <v-chip
              size="small"
              :color="(item as any).raw?.method === 'GET' ? 'success' : (item as any).raw?.method === 'POST' ? 'primary' : (item as any).raw?.method === 'PUT' ? 'warning' : (item as any).raw?.method === 'DELETE' ? 'error' : 'secondary'"
              variant="flat"
              class="mr-2"
            >
              {{ (item as any).raw?.method }}
            </v-chip>
          </template>
          <v-list-item-title>{{ (item as any).raw?.path }}</v-list-item-title>
        </v-list-item>
      </template>
    </v-autocomplete>

    <v-row>
      <v-col cols="12" md="6">
        <v-select
          id="method"
          :model-value="method"
          @update:model-value="emit('update:method', $event)"
          :items="httpMethods"
          :label="`${t('xroad.request.method')} *`"
          :error-messages="errors['request.method']"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          id="path"
          :model-value="path"
          @update:model-value="emit('update:path', $event)"
          :label="`${t('xroad.request.path')} *`"
          :placeholder="t('xroad.placeholders.path')"
          :error-messages="errors['request.path']"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>

    <v-textarea
      id="body"
      :model-value="body"
      @update:model-value="emit('update:body', $event)"
      :label="t('xroad.request.body')"
      :placeholder="t('xroad.request.bodyPlaceholder')"
      rows="4"
      variant="outlined"
      density="comfortable"
    />

    <v-select
      v-if="showContentType"
      id="contentType"
      :model-value="contentType"
      @update:model-value="emit('update:contentType', $event)"
      :items="contentTypes"
      :label="t('xroad.request.contentType')"
      variant="outlined"
      density="comfortable"
    />
  </div>
</template>
