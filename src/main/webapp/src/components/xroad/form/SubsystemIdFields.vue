<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  prefix: 'client' | 'service';
  idPrefix?: string;
  instanceId: string;
  memberClass: string;
  memberCode: string;
  subsystemCode: string;
  errors: Record<string, string>;
}>();

const emit = defineEmits<{
  'update:instanceId': [value: string];
  'update:memberClass': [value: string];
  'update:memberCode': [value: string];
  'update:subsystemCode': [value: string];
}>();

const { t } = useI18n();
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        :id="`${idPrefix ?? ''}instanceId`"
        :model-value="instanceId"
        @update:model-value="emit('update:instanceId', $event)"
        :label="`${t(`xroad.${prefix}.instanceId`)} *`"
        :placeholder="t('xroad.placeholders.instanceId')"
        :error-messages="errors.instanceId"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        :id="`${idPrefix ?? ''}memberClass`"
        :model-value="memberClass"
        @update:model-value="emit('update:memberClass', $event)"
        :label="`${t(`xroad.${prefix}.memberClass`)} *`"
        :placeholder="t('xroad.placeholders.memberClass')"
        :error-messages="errors.memberClass"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        :id="`${idPrefix ?? ''}memberCode`"
        :model-value="memberCode"
        @update:model-value="emit('update:memberCode', $event)"
        :label="`${t(`xroad.${prefix}.memberCode`)} *`"
        :placeholder="prefix === 'service' ? t('xroad.placeholders.serviceMemberCode') : t('xroad.placeholders.memberCode')"
        :error-messages="errors.memberCode"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        :id="`${idPrefix ?? ''}subsystemCode`"
        :model-value="subsystemCode"
        @update:model-value="emit('update:subsystemCode', $event)"
        :label="`${t(`xroad.${prefix}.subsystemCode`)} *`"
        :placeholder="prefix === 'service' ? t('xroad.placeholders.serviceSubsystemCode') : t('xroad.placeholders.subsystemCode')"
        :error-messages="errors.subsystemCode"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
  </v-row>
</template>
