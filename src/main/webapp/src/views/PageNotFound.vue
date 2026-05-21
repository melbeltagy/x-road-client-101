<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

function goHome(): void {
  router.push('/');
}
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <h1 class="text-h1 text-primary mb-4">404</h1>
        <h2 class="text-h5 mb-4">{{ t('error.http.404') }}</h2>
        <v-btn color="primary" @click="goHome">
          {{ t('global.menu.home') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
