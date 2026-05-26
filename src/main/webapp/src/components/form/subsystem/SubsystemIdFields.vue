<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubsystemId } from '@/types';
import SubsystemField from './SubsystemField.vue';

const props = defineProps<{
  prefix: 'client' | 'service';
  idPrefix?: string;
  instanceId: string;
  memberClass: string;
  memberCode: string;
  subsystemCode: string;
  errors: Record<string, string>;
  suggestions?: SubsystemId[];
}>();

const emit = defineEmits<{
  'update:instanceId': [value: string];
  'update:memberClass': [value: string];
  'update:memberCode': [value: string];
  'update:subsystemCode': [value: string];
  'select': [subsystem: SubsystemId];
}>();

const { t } = useI18n();

// Cascading suggestion filters: each level narrows by the levels above it.
function filterSuggestions(filters: Partial<SubsystemId>): SubsystemId[] {
  return (props.suggestions ?? []).filter((s) =>
    (Object.entries(filters) as [keyof SubsystemId, string | undefined][])
      .every(([key, value]) => !value || s[key] === value)
  );
}

function uniqueField(filtered: SubsystemId[], key: keyof SubsystemId): string[] {
  return [...new Set(filtered.map((s) => s[key]))];
}

const instanceIdOptions = computed(() =>
  uniqueField(filterSuggestions({}), 'instanceId')
);

const memberClassOptions = computed(() =>
  uniqueField(filterSuggestions({ instanceId: props.instanceId }), 'memberClass')
);

const memberCodeOptions = computed(() =>
  uniqueField(
    filterSuggestions({ instanceId: props.instanceId, memberClass: props.memberClass }),
    'memberCode'
  )
);

const subsystemCodeOptions = computed(() =>
  uniqueField(
    filterSuggestions({
      instanceId: props.instanceId,
      memberClass: props.memberClass,
      memberCode: props.memberCode,
    }),
    'subsystemCode'
  )
);

// Handle selection - when subsystem code is selected, auto-fill all fields
function handleSubsystemCodeUpdate(subsystemCode: string): void {
  emit('update:subsystemCode', subsystemCode);

  // Find matching subsystem and emit select event
  const matching = props.suggestions?.find(
    (s) =>
      s.subsystemCode === subsystemCode &&
      (!props.instanceId || s.instanceId === props.instanceId) &&
      (!props.memberClass || s.memberClass === props.memberClass) &&
      (!props.memberCode || s.memberCode === props.memberCode)
  );

  if (matching) {
    emit('select', matching);
  }
}

// Placeholder differs per prefix for memberCode and subsystemCode.
const memberCodePlaceholder = computed(() =>
  props.prefix === 'service' ? t('xroad.placeholders.serviceMemberCode') : t('xroad.placeholders.memberCode')
);
const subsystemCodePlaceholder = computed(() =>
  props.prefix === 'service' ? t('xroad.placeholders.serviceSubsystemCode') : t('xroad.placeholders.subsystemCode')
);

const idFor = (field: string): string => `${props.idPrefix ?? ''}${field}`;
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <SubsystemField
        :id="idFor('instanceId')"
        :model-value="instanceId"
        :label="`${t(`xroad.${prefix}.instanceId`)} *`"
        :placeholder="t('xroad.placeholders.instanceId')"
        :error-message="errors.instanceId"
        :items="instanceIdOptions"
        @update:model-value="emit('update:instanceId', $event)"
      />
    </v-col>
    <v-col cols="12" md="6">
      <SubsystemField
        :id="idFor('memberClass')"
        :model-value="memberClass"
        :label="`${t(`xroad.${prefix}.memberClass`)} *`"
        :placeholder="t('xroad.placeholders.memberClass')"
        :error-message="errors.memberClass"
        :items="memberClassOptions"
        @update:model-value="emit('update:memberClass', $event)"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="6">
      <SubsystemField
        :id="idFor('memberCode')"
        :model-value="memberCode"
        :label="`${t(`xroad.${prefix}.memberCode`)} *`"
        :placeholder="memberCodePlaceholder"
        :error-message="errors.memberCode"
        :items="memberCodeOptions"
        @update:model-value="emit('update:memberCode', $event)"
      />
    </v-col>
    <v-col cols="12" md="6">
      <SubsystemField
        :id="idFor('subsystemCode')"
        :model-value="subsystemCode"
        :label="`${t(`xroad.${prefix}.subsystemCode`)} *`"
        :placeholder="subsystemCodePlaceholder"
        :error-message="errors.subsystemCode"
        :items="subsystemCodeOptions"
        @update:model-value="handleSubsystemCodeUpdate"
      />
    </v-col>
  </v-row>
</template>
