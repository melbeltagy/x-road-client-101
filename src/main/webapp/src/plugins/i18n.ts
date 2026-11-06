import { createI18n } from "vue-i18n";
import en from "@/i18n/locales/en.json";

export type MessageSchema = typeof en;
export type SupportedLocale = "en" | "et" | "fi" | "de" | "fr";

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
  },
});

// Explicit loaders keyed on non-"en" locales. en is bundled statically for the
// MessageSchema type and default preload; excluding it here keeps Rolldown from
// emitting INEFFECTIVE_DYNAMIC_IMPORT when the glob would otherwise also match en.json.
const loaders: Record<Exclude<SupportedLocale, "en">, () => Promise<{ default: MessageSchema }>> = {
  et: () => import("@/i18n/locales/et.json"),
  fi: () => import("@/i18n/locales/fi.json"),
  de: () => import("@/i18n/locales/de.json"),
  fr: () => import("@/i18n/locales/fr.json"),
};

export async function loadLocaleMessages(locale: SupportedLocale): Promise<void> {
  if ((i18n.global.availableLocales as string[]).includes(locale)) {
    return;
  }
  if (locale === "en") {
    return;
  }

  const messages = await loaders[locale]();
  i18n.global.setLocaleMessage(locale, messages.default);
}

export function setI18nLanguage(locale: string): void {
  (i18n.global.locale as { value: string }).value = locale;
  document.querySelector("html")?.setAttribute("lang", locale);
}

export default i18n;
