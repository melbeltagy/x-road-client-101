import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useTheme } from 'vuetify';
import { safeLocalStorage } from '@/utils/safe-local-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore(
  'theme',
  () => {
    const themeMode = ref<ThemeMode>('system');
    const systemPrefersDark = ref(
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false
    );
    const vuetifyTheme = useTheme();

    const effectiveTheme = computed<'light' | 'dark'>(() => {
      if (themeMode.value === 'system') {
        return systemPrefersDark.value ? 'dark' : 'light';
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
        mediaQuery.addEventListener('change', (e) => {
          systemPrefersDark.value = e.matches;
        });
      }
    }

    // Watch for effective theme changes (covers both manual mode and system preference changes)
    watch(effectiveTheme, () => {
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
      storage: safeLocalStorage,
      pick: ['themeMode'],
    },
  }
);
