<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore, type ThemeMode } from "@/stores/theme";

const { t } = useI18n();
const themeStore = useThemeStore();

const themeOptions: { value: ThemeMode; icon: string; labelKey: string }[] = [
  { value: "light", icon: "light_mode", labelKey: "global.menu.theme.light" },
  { value: "dark", icon: "dark_mode", labelKey: "global.menu.theme.dark" },
  { value: "system", icon: "computer", labelKey: "global.menu.theme.system" },
];

const currentIcon = computed(() => {
  const option = themeOptions.find((o) => o.value === themeStore.themeMode);
  return option?.icon ?? "computer";
});

function selectTheme(mode: ThemeMode): void {
  themeStore.setThemeMode(mode);
}
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn icon v-bind="props" variant="text">
        <v-icon>{{ currentIcon }}</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="option in themeOptions"
        :key="option.value"
        :active="themeStore.themeMode === option.value"
        @click="selectTheme(option.value)"
      >
        <template #prepend>
          <v-icon>{{ option.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ t(option.labelKey) }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
