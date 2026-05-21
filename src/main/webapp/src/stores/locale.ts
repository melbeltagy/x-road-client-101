import { defineStore } from 'pinia';
import { ref } from 'vue';
import dayjs from 'dayjs';
import { loadLocaleMessages, setI18nLanguage } from '@/plugins/i18n';

export type SupportedLocale = 'en' | 'et' | 'fi' | 'de' | 'fr';

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Eesti' },
  { code: 'fi', name: 'Suomi' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
];

export const useLocaleStore = defineStore(
  'locale',
  () => {
    const currentLocale = ref<SupportedLocale>('en');
    const loadedLocales = ref<SupportedLocale[]>(['en']);

    async function setLocale(locale: SupportedLocale): Promise<void> {
      if (!loadedLocales.value.includes(locale)) {
        await loadLocaleMessages(locale);
        loadedLocales.value.push(locale);
      }

      currentLocale.value = locale;
      setI18nLanguage(locale);

      // Update dayjs locale
      try {
        if (locale !== 'en') {
          await import(`dayjs/locale/${locale}.js`);
        }
        dayjs.locale(locale);
      } catch {
        // Fallback to English if locale not available
        dayjs.locale('en');
      }
    }

    async function initializeLocale(): Promise<void> {
      // If we have a persisted locale different from English, load it
      if (currentLocale.value !== 'en') {
        await setLocale(currentLocale.value);
      }
    }

    return {
      currentLocale,
      loadedLocales,
      setLocale,
      initializeLocale,
    };
  },
  {
    persist: {
      key: 'xroad-locale',
      storage: sessionStorage,
      pick: ['currentLocale'],
    },
  }
);
