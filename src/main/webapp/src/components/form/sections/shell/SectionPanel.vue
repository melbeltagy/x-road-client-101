<script setup lang="ts">
import { computed } from "vue";
import type { StepState } from "@/composables";

const props = withDefaults(
  defineProps<{
    value: string;
    icon: string;
    title: string;
    /** Drives the per-state visual treatment: amber for 'next', muted for 'optional', etc. */
    state?: StepState;
  }>(),
  { state: "pending" },
);

const iconColor = computed(() => {
  switch (props.state) {
    case "done":
      return "success";
    case "next":
      return "warning";
    case "optional":
      return "grey-lighten-1";
    default:
      return "primary";
  }
});
</script>

<template>
  <v-expansion-panel :value="value" :class="['section-panel', `section-${state}`]">
    <v-expansion-panel-title>
      <div class="d-flex align-center w-100">
        <v-icon start :color="iconColor">{{ icon }}</v-icon>
        <strong :class="['section-title', state === 'next' ? 'font-weight-bold' : '']">{{ title }}</strong>
        <slot name="chip" />
        <v-icon v-if="state === 'done'" color="success" size="small" class="ml-auto mr-2" aria-label="completed">check_circle</v-icon>
      </div>
    </v-expansion-panel-title>
    <v-expansion-panel-text eager>
      <slot />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<style scoped>
/* Next — amber left border draws the eye to the section the user should fill. */
.section-next {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

/* Optional sections appear visually de-prioritized so the eye doesn't
   read them as "required and not done yet". */
.section-optional :deep(.v-expansion-panel-title) {
  opacity: 0.75;
}
</style>
