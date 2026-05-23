<script setup lang="ts">
import { onMounted } from 'vue';
import { useThemeStore } from '@/stores/theme';
import { useLocaleStore } from '@/stores/locale';
import { useConfigStore } from '@/stores/config';
import AppHeader from '@/components/layout/AppHeader.vue';

const themeStore = useThemeStore();
const localeStore = useLocaleStore();
const configStore = useConfigStore();

onMounted(() => {
  themeStore.initializeTheme();
  localeStore.initializeLocale();
  configStore.initializeConfig();
});
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
html {
  overflow-y: auto;
}
</style>
