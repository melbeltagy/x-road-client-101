<script setup lang="ts">
import type { AlertType } from "@/composables";

interface AlertState {
  show: boolean;
  type: AlertType;
  message: string;
}

interface HistoryAlertState {
  show: boolean;
  message: string;
}

defineProps<{
  alert: AlertState;
  historyAlert: HistoryAlertState;
}>();

const emit = defineEmits<{
  "update:alertShow": [value: boolean];
  "update:historyAlertShow": [value: boolean];
}>();
</script>

<template>
  <!-- Primary toast: request results (success/error/warning/info). -->
  <v-snackbar
    :model-value="alert.show"
    :color="alert.type"
    :timeout="5000"
    location="top"
    @update:model-value="emit('update:alertShow', $event)"
  >
    {{ alert.message }}
    <template #actions>
      <v-btn variant="text" @click="emit('update:alertShow', false)">
        <v-icon>close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>

  <!-- Secondary toast: history-persistence warnings. Different position
       so it doesn't overwrite the primary toast when both fire. -->
  <v-snackbar
    :model-value="historyAlert.show"
    color="warning"
    :timeout="5000"
    location="top right"
    @update:model-value="emit('update:historyAlertShow', $event)"
  >
    <v-icon start>history</v-icon>
    {{ historyAlert.message }}
    <template #actions>
      <v-btn variant="text" @click="emit('update:historyAlertShow', false)">
        <v-icon>close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>
