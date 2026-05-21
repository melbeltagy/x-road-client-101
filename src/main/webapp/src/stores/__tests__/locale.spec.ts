import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock the i18n plugin
vi.mock('@/plugins/i18n', () => ({
  loadLocaleMessages: vi.fn().mockResolvedValue(undefined),
  setI18nLanguage: vi.fn(),
}));

// Mock dayjs
vi.mock('dayjs', () => ({
  default: {
    locale: vi.fn(),
  },
}));

import {
  useLocaleStore,
  SUPPORTED_LOCALES,
  detectInitialLocale,
  LOCALE_STORAGE_KEY,
} from '../locale';

describe('Locale Store', () => {
  // Track localStorage values for mocking
  let localStorageValues: Record<string, string> = {};

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset localStorage mock values
    localStorageValues = {};

    // Configure localStorage mock to actually store/retrieve values
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      return localStorageValues[key] ?? null;
    });
    vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
      localStorageValues[key] = value;
    });
    vi.mocked(localStorage.clear).mockImplementation(() => {
      localStorageValues = {};
    });
    vi.mocked(localStorage.removeItem).mockImplementation((key: string) => {
      delete localStorageValues[key];
    });

    // Reset navigator.languages to default English
    Object.defineProperty(navigator, 'languages', {
      value: ['en-US'],
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      writable: true,
      configurable: true,
    });
  });

  describe('SUPPORTED_LOCALES', () => {
    it('should have 5 supported locales', () => {
      expect(SUPPORTED_LOCALES).toHaveLength(5);
    });

    it('should include en, et, fi, de, fr', () => {
      const codes = SUPPORTED_LOCALES.map((l) => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('et');
      expect(codes).toContain('fi');
      expect(codes).toContain('de');
      expect(codes).toContain('fr');
    });
  });

  describe('detectInitialLocale', () => {
    it('should default to en when no stored locale and browser is English', () => {
      expect(detectInitialLocale()).toBe('en');
    });

    it('should use stored locale from localStorage', () => {
      localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
      expect(detectInitialLocale()).toBe('de');
    });

    it('should detect browser locale when no stored preference', () => {
      Object.defineProperty(navigator, 'languages', {
        value: ['fi-FI', 'en-US'],
        configurable: true,
      });
      expect(detectInitialLocale()).toBe('fi');
    });

    it('should fallback to en for unsupported browser locale', () => {
      Object.defineProperty(navigator, 'languages', {
        value: ['ja-JP', 'zh-CN'],
        configurable: true,
      });
      expect(detectInitialLocale()).toBe('en');
    });

    it('should ignore invalid stored locale', () => {
      localStorage.setItem(LOCALE_STORAGE_KEY, 'invalid');
      expect(detectInitialLocale()).toBe('en');
    });
  });

  describe('initial state', () => {
    it('should have en as default locale when browser is English', () => {
      const store = useLocaleStore();
      expect(store.currentLocale).toBe('en');
    });

    it('should have en in loaded locales', () => {
      const store = useLocaleStore();
      expect(store.loadedLocales).toContain('en');
    });
  });

  describe('setLocale', () => {
    it('should set locale to a supported value', async () => {
      const store = useLocaleStore();
      await store.setLocale('et');
      expect(store.currentLocale).toBe('et');
    });

    it('should persist locale to localStorage', async () => {
      const store = useLocaleStore();
      await store.setLocale('fr');
      expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('fr');
    });

    it('should set locale to fi', async () => {
      const store = useLocaleStore();
      await store.setLocale('fi');
      expect(store.currentLocale).toBe('fi');
    });

    it('should add locale to loadedLocales', async () => {
      const store = useLocaleStore();
      await store.setLocale('de');
      expect(store.loadedLocales).toContain('de');
    });
  });
});
