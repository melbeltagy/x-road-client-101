<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useXRoadHistoryStore } from "@/stores/xroad-history";
import Brand from "./Brand.vue";
import ThemeToggle from "./ThemeToggle.vue";
import LocaleMenu from "./LocaleMenu.vue";

const { t } = useI18n();
const historyStore = useXRoadHistoryStore();
const mobileNav = ref(false);

function toggleHistorySidebar(): void {
  historyStore.toggleHistorySidebar();
}
</script>

<template>
  <v-app-bar color="primary" density="default" elevation="2">
    <v-app-bar-nav-icon class="d-md-none" @click="mobileNav = !mobileNav" aria-label="Menu" />

    <Brand />

    <v-spacer />

    <!-- Desktop navigation -->
    <div class="d-none d-md-flex align-center">
      <v-btn variant="text" @click="toggleHistorySidebar">
        <v-icon start>history</v-icon>
        {{ t("xroad.history.button") }}
      </v-btn>

      <ThemeToggle />
      <LocaleMenu />
    </div>

    <!-- Mobile navigation menu -->
    <template #extension v-if="mobileNav">
      <v-sheet class="d-md-none w-100 pa-2" color="primary">
        <v-btn block variant="text" class="justify-start mb-2" @click="toggleHistorySidebar">
          <v-icon start>history</v-icon>
          {{ t("xroad.history.button") }}
        </v-btn>
        <div class="d-flex justify-center">
          <ThemeToggle />
          <LocaleMenu />
        </div>
      </v-sheet>
    </template>
  </v-app-bar>
</template>
