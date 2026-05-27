<script setup lang="ts">
import { useLocaleStore, SUPPORTED_LOCALES, type SupportedLocale } from "@/stores/locale";

const localeStore = useLocaleStore();

async function selectLocale(locale: SupportedLocale): Promise<void> {
  await localeStore.setLocale(locale);
}
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn icon v-bind="props" variant="text">
        <v-icon>translate</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="locale in SUPPORTED_LOCALES"
        :key="locale.code"
        :active="localeStore.currentLocale === locale.code"
        @click="selectLocale(locale.code)"
      >
        <v-list-item-title>{{ locale.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
