import { Storage, TranslatorContext } from 'app/shared/i18n';

import { setLocale } from 'app/shared/reducers/locale';

TranslatorContext.setDefaultLocale('en');
TranslatorContext.setRenderInnerTextForMissingKeys(false);

export const languages: Record<string, { name: string }> = {
  en: { name: 'English' },
  fr: { name: 'Français' },
  et: { name: 'Eesti' },
  de: { name: 'Deutsch' },
  fi: { name: 'Suomi' },
};

export const locales = Object.keys(languages).sort();

export const registerLocale = store => {
  store.dispatch(setLocale(Storage.session.get('locale', 'en') ?? 'en'));
};
