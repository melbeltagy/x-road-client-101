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

import { useLocaleStore, SUPPORTED_LOCALES } from '../locale';

describe('Locale Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
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

  describe('initial state', () => {
    it('should have en as default locale', () => {
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
