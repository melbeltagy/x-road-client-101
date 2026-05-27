<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useXRoadHistoryStore, type RequestHistoryEntry } from "@/stores/xroad-history";
import HistoryEntry from "./HistoryEntry.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";

const emit = defineEmits<{
  view: [entry: RequestHistoryEntry];
  showAlert: [color: "success" | "error" | "warning", message: string];
  historyWarning: [message: string];
}>();

const { t } = useI18n();
const historyStore = useXRoadHistoryStore();

const clearConfirmOpen = ref(false);

function handleClearAll(): void {
  clearConfirmOpen.value = true;
}

// Run a store mutation and surface either a success toast (primary
// channel) or a history-warning toast (secondary channel) so the
// primary channel stays free for request results.
function runHistoryMutation(mutate: () => boolean, successMessageKey: string, onSuccess?: () => void): void {
  const ok = mutate();
  if (ok && !historyStore.lastError) {
    emit("showAlert", "success", t(successMessageKey));
    onSuccess?.();
  } else {
    emit("historyWarning", t("xroad.toast.historyError"));
    historyStore.clearError();
  }
}

function confirmClearAll(): void {
  runHistoryMutation(
    () => historyStore.clearHistory(),
    "xroad.history.cleared",
    () => historyStore.closeHistorySidebar(),
  );
}

function handleView(entry: RequestHistoryEntry): void {
  historyStore.selectHistoryEntry(entry.id);
  emit("view", entry);
}

function handleDelete(entryId: string): void {
  runHistoryMutation(() => historyStore.deleteHistoryEntry(entryId), "xroad.history.deleted");
}

function handleClose(): void {
  historyStore.closeHistorySidebar();
}
</script>

<template>
  <v-navigation-drawer
    :model-value="historyStore.sidebarOpen"
    @update:model-value="!$event && handleClose()"
    location="right"
    temporary
    width="400"
  >
    <template #prepend>
      <v-toolbar color="surface" density="compact">
        <v-toolbar-title>{{ t("xroad.history.title") }}</v-toolbar-title>
        <v-btn icon @click="handleClose">
          <v-icon>close</v-icon>
        </v-btn>
      </v-toolbar>
    </template>

    <!-- Empty state -->
    <v-container v-if="historyStore.entries.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">history</v-icon>
      <h3 class="text-h6 mb-2">{{ t("xroad.history.empty") }}</h3>
      <p class="text-medium-emphasis">{{ t("xroad.history.emptyDescription") }}</p>
    </v-container>

    <!-- History list -->
    <template v-else>
      <v-container class="pa-3">
        <v-btn color="error" variant="outlined" size="small" @click="handleClearAll">
          <v-icon start>delete_sweep</v-icon>
          {{ t("xroad.history.clearAll") }}
        </v-btn>
      </v-container>

      <v-divider />

      <v-list lines="three" class="history-list">
        <HistoryEntry
          v-for="entry in historyStore.entries"
          :key="entry.id"
          :entry="entry"
          :is-selected="entry.id === historyStore.selectedEntryId"
          @view="handleView"
          @delete="handleDelete"
        />
      </v-list>
    </template>
  </v-navigation-drawer>

  <!-- Confirm: wipe all history -->
  <ConfirmDialog v-model="clearConfirmOpen" :message="t('xroad.history.confirmClear')" color="error" @confirm="confirmClearAll" />
</template>

<style scoped>
.history-list {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}
</style>
