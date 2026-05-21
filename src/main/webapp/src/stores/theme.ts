import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useTheme } from 'vuetify';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore(
  'theme',
  () => {
    const themeMode = ref<ThemeMode>('system');
    const vuetifyTheme = useTheme();

    const effectiveTheme = computed<'light' | 'dark'>(() => {
      if (themeMode.value === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return themeMode.value;
    });

    function setThemeMode(mode: ThemeMode): void {
      themeMode.value = mode;
      applyTheme();
    }

    function applyTheme(): void {
      vuetifyTheme.global.name.value = effectiveTheme.value;
    }

    function initializeTheme(): void {
      applyTheme();

      // Listen for system theme changes
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
          if (themeMode.value === 'system') {
            applyTheme();
          }
        });
      }
    }

    // Watch for theme mode changes
    watch(themeMode, () => {
      applyTheme();
    });

    return {
      themeMode,
      effectiveTheme,
      setThemeMode,
      initializeTheme,
    };
  },
  {
    persist: {
      key: 'xroad-theme-preference',
      storage: localStorage,
      pick: ['themeMode'],
    },
  }
);
