import { createI18n } from "vue-i18n";
import en from "@/i18n/locales/en.json";

/**
 * Test i18n instance preloaded with the real English message bundle.
 *
 * Using the real bundle (rather than hand-rolled stubs in every spec)
 * keeps tests realistic and removes a whole class of "key not found"
 * false negatives when assertions reference text the user would
 * actually see. Missing-warn is silenced because tests sometimes
 * exercise edge keys that aren't worth wiring into the bundle.
 */
export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    messages: { en },
    missingWarn: false,
    fallbackWarn: false,
  });
}
