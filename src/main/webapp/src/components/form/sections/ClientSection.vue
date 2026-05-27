<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SubsystemIdFields from "../subsystem/SubsystemIdFields.vue";
import ClearButton from "@/components/common/ClearButton.vue";
import type { SubsystemId } from "@/types";

const props = defineProps<{
  subsystem: SubsystemId;
  securityServerUrl: string;
  errors: Record<string, string>;
  suggestions?: SubsystemId[];
  isLoading?: boolean;
  fetchError?: string | null;
}>();

const emit = defineEmits<{
  "update:subsystem": [value: SubsystemId];
  clear: [];
}>();

const { t } = useI18n();

function updateSubsystemField(field: keyof SubsystemId, value: string): void {
  emit("update:subsystem", {
    ...props.subsystem,
    [field]: value,
  });
}

function handleSubsystemSelect(subsystem: SubsystemId): void {
  emit("update:subsystem", { ...subsystem });
}
</script>

<template>
  <div>
    <ClearButton :title="t('xroad.client.clear')" @click="emit('clear')" />

    <SubsystemIdFields
      prefix="client"
      :instance-id="subsystem.instanceId"
      :member-class="subsystem.memberClass"
      :member-code="subsystem.memberCode"
      :subsystem-code="subsystem.subsystemCode"
      :errors="{
        instanceId: errors['client.subsystem.instanceId'] ?? '',
        memberClass: errors['client.subsystem.memberClass'] ?? '',
        memberCode: errors['client.subsystem.memberCode'] ?? '',
        subsystemCode: errors['client.subsystem.subsystemCode'] ?? '',
      }"
      :suggestions="suggestions"
      @update:instance-id="updateSubsystemField('instanceId', $event)"
      @update:member-class="updateSubsystemField('memberClass', $event)"
      @update:member-code="updateSubsystemField('memberCode', $event)"
      @update:subsystem-code="updateSubsystemField('subsystemCode', $event)"
      @select="handleSubsystemSelect"
    />
  </div>
</template>
