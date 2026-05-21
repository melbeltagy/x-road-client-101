<script setup lang="ts">
import { onMounted } from 'vue';
import { useThemeStore } from '@/stores/theme';
import { useLocaleStore } from '@/stores/locale';
import AppHeader from '@/components/layout/AppHeader.vue';

const themeStore = useThemeStore();
const localeStore = useLocaleStore();

onMounted(() => {
  themeStore.initializeTheme();
  localeStore.initializeLocale();
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
