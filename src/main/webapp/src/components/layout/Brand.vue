<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <router-link to="/" class="brand-link text-decoration-none">
    <v-toolbar-title class="font-weight-bold">
      {{ t('global.title') }}
    </v-toolbar-title>
  </router-link>
</template>

<style scoped>
.brand-link {
  color: inherit;
}
</style>
