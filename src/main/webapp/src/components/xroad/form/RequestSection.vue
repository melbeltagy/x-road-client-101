<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  method: string;
  path: string;
  body: string;
  contentType: string;
  errors: Record<string, string>;
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

const contentTypes = [
  { title: '-- Select --', value: '' },
  { title: 'application/json', value: 'application/json' },
  { title: 'application/xml', value: 'application/xml' },
  { title: 'text/plain', value: 'text/plain' },
  { title: 'text/xml', value: 'text/xml' },
  { title: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
];

const showContentType = computed(() => {
  return props.body && props.body.trim() !== '';
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
