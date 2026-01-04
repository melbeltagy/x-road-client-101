import React, { createContext, useContext, useState, ReactNode, ElementType } from 'react';

// Translation data store
interface TranslationContextType {
  translations: Record<string, Record<string, unknown>>;
  locale: string;
  defaultLocale: string;
  lastChange: Date;
  renderInnerTextForMissingKeys: boolean;
}

const translationStore: TranslationContextType = {
  translations: {},
  locale: 'en',
  defaultLocale: 'en',
  lastChange: new Date(),
  renderInnerTextForMissingKeys: true,
};

/**
 * Get a nested value from an object using dot notation.
 */
const getNestedValue = (obj: unknown, path: string): unknown => {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

/**
 * Interpolate variables in a string.
 * Supports {{variable}} syntax.
 */
const interpolate = (text: string, data?: Record<string, unknown>): string => {
  if (!data) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = data[key];
    if (value === undefined) return `{{${key}}}`;
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
    return `{{${key}}}`;
  });
};

/**
 * Get translation for a key.
 */
const getTranslation = (key: string, data?: Record<string, unknown>): string | undefined => {
  const { translations, locale, defaultLocale, renderInnerTextForMissingKeys } = translationStore;

  // Try current locale first
  let value = getNestedValue(translations[locale], key);

  // Fall back to default locale
  if (value === undefined && locale !== defaultLocale) {
    value = getNestedValue(translations[defaultLocale], key);
  }

  if (typeof value === 'string') {
    return interpolate(value, data);
  }

  // Return the key itself if renderInnerTextForMissingKeys is true
  return renderInnerTextForMissingKeys ? key : undefined;
};

/**
 * TranslatorContext - provides static methods for managing translations.
 */
export const TranslatorContext = {
  context: translationStore,

  setDefaultLocale(locale: string): void {
    translationStore.defaultLocale = locale;
  },

  setLocale(locale: string): void {
    translationStore.locale = locale;
    translationStore.lastChange = new Date();
  },

  setRenderInnerTextForMissingKeys(render: boolean): void {
    translationStore.renderInnerTextForMissingKeys = render;
  },

  registerTranslations(locale: string, data: Record<string, unknown>): void {
    translationStore.translations[locale] = {
      ...translationStore.translations[locale],
      ...data,
    };
    translationStore.lastChange = new Date();
  },
};

/**
 * translate function - returns translated string for a key.
 */
export const translate = (key: string, data?: Record<string, unknown>): string => {
  return getTranslation(key, data) ?? key;
};

// React context for triggering re-renders on locale change
const I18nReactContext = createContext<{ lastChange: Date }>({ lastChange: new Date() });

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * I18nProvider - wraps the app to provide translation context.
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [lastChange, setLastChange] = useState(translationStore.lastChange);

  // Expose a way to trigger re-renders (called from locale reducer)
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (translationStore.lastChange !== lastChange) {
        setLastChange(translationStore.lastChange);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [lastChange]);

  return <I18nReactContext.Provider value={{ lastChange }}>{children}</I18nReactContext.Provider>;
};

interface TranslateProps {
  contentKey: string;
  interpolate?: Record<string, unknown>;
  children?: ReactNode;
  component?: ElementType<{ dangerouslySetInnerHTML: { __html: string } }>;
}

/**
 * Translate component - renders translated text.
 */
export const Translate: React.FC<TranslateProps> = ({ contentKey, interpolate: data, children, component: Component = 'span' }) => {
  // Subscribe to context changes to trigger re-renders
  useContext(I18nReactContext);

  const translation = getTranslation(contentKey, data);

  if (translation !== undefined) {
    return <Component dangerouslySetInnerHTML={{ __html: translation }} />;
  }

  // Fall back to children if no translation found
  return <>{children}</>;
};
