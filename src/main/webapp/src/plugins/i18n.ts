import { createI18n } from 'vue-i18n';
import en from '@/i18n/locales/en.json';

export type MessageSchema = typeof en;
export type SupportedLocale = 'en' | 'et' | 'fi' | 'de' | 'fr';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
  },
});

export async function loadLocaleMessages(locale: string): Promise<void> {
  if ((i18n.global.availableLocales as string[]).includes(locale)) {
    return;
  }

  const messages = await import(`@/i18n/locales/${locale}.json`);
  i18n.global.setLocaleMessage(locale, messages.default);
}

export function setI18nLanguage(locale: string): void {
  (i18n.global.locale as { value: string }).value = locale;
  document.querySelector('html')?.setAttribute('lang', locale);
}

export default i18n;
