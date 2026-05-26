<script setup lang="ts">
defineProps<{
  value: string;
  icon: string;
  title: string;
}>();
</script>

<template>
  <v-expansion-panel :value="value">
    <v-expansion-panel-title>
      <div class="d-flex align-center">
        <v-icon start color="primary">{{ icon }}</v-icon>
        <strong>{{ title }}</strong>
        <slot name="chip" />
      </div>
    </v-expansion-panel-title>
    <v-expansion-panel-text eager>
      <slot />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
