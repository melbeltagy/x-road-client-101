import { defineStore } from 'pinia';
import { ref } from 'vue';
import dayjs from 'dayjs';
import { loadLocaleMessages, setI18nLanguage } from '@/plugins/i18n';

export type SupportedLocale = 'en' | 'et' | 'fi' | 'de' | 'fr';

export const LOCALE_STORAGE_KEY = 'xroad-locale';

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Eesti' },
  { code: 'fi', name: 'Suomi' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
];

const SUPPORTED_LOCALE_CODES = SUPPORTED_LOCALES.map((l) => l.code);

/**
 * Detects the best locale to use based on:
 * 1. Stored preference in localStorage
 * 2. Browser's language settings
 * 3. Default to English
 */
export function detectInitialLocale(): SupportedLocale {
  // 1. Check localStorage for stored preference
  try {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && SUPPORTED_LOCALE_CODES.includes(storedLocale as SupportedLocale)) {
      return storedLocale as SupportedLocale;
    }
  } catch {
    // localStorage might not be available (SSR, etc.)
  }

  // 2. Try to match browser's language
  try {
    const browserLanguages = navigator.languages || [navigator.language];
    for (const lang of browserLanguages) {
      // Try exact match first (e.g., 'en-US' -> 'en')
      const langCode = lang.split('-')[0].toLowerCase();
      if (SUPPORTED_LOCALE_CODES.includes(langCode as SupportedLocale)) {
        return langCode as SupportedLocale;
      }
    }
  } catch {
    // navigator might not be available (SSR, etc.)
  }

  // 3. Default to English
  return 'en';
}

function persistLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage might not be available
  }
}

async function applyDayjsLocale(locale: SupportedLocale): Promise<void> {
  try {
    if (locale !== 'en') {
      await import(/* @vite-ignore */ `dayjs/locale/${locale}.js`);
    }
    dayjs.locale(locale);
  } catch {
    // Fallback to English if locale not available
    dayjs.locale('en');
  }
}

export const useLocaleStore = defineStore('locale', () => {
  // Detect initial locale when store is first created
  const currentLocale = ref<SupportedLocale>(detectInitialLocale());
  const loadedLocales = ref<SupportedLocale[]>(['en']);

  async function ensureLocaleLoaded(locale: SupportedLocale): Promise<void> {
    if (!loadedLocales.value.includes(locale)) {
      await loadLocaleMessages(locale);
      loadedLocales.value.push(locale);
    }
  }

  async function setLocale(locale: SupportedLocale): Promise<void> {
    await ensureLocaleLoaded(locale);
    currentLocale.value = locale;
    setI18nLanguage(locale);
    persistLocale(locale);
    await applyDayjsLocale(locale);
  }

  async function initializeLocale(): Promise<void> {
    // Load the detected/stored locale
    await setLocale(currentLocale.value);
  }

  return {
    currentLocale,
    loadedLocales,
    setLocale,
    initializeLocale,
  };
});
