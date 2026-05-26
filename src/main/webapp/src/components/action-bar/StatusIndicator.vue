<script setup lang="ts">
defineProps<{
  icon: string;
  color: string;
  label: string;
}>();
</script>

<template>
  <div class="d-flex align-center">
    <v-icon :color="color" size="x-large" class="mr-2">{{ icon }}</v-icon>
    <span class="text-h6">{{ label }}</span>
  </div>
</template>
