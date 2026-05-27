import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createTestI18n } from "@/test/i18n";

// Mock all three stores' initialize* methods to avoid touching i18n/dayjs/network.
const initTheme = vi.fn();
const initLocale = vi.fn().mockResolvedValue(undefined);
const initConfig = vi.fn().mockResolvedValue(undefined);

vi.mock("@/stores/theme", () => ({
  useThemeStore: () => ({ initializeTheme: initTheme, themeMode: "light", effectiveTheme: "light" }),
}));
vi.mock("@/stores/locale", () => ({
  useLocaleStore: () => ({ initializeLocale: initLocale, currentLocale: "en" }),
  SUPPORTED_LOCALES: [{ code: "en", name: "English" }],
}));
vi.mock("@/stores/config", () => ({
  useConfigStore: () => ({ initializeConfig: initConfig }),
}));
vi.mock("@/stores/xroad-history", () => ({
  useXRoadHistoryStore: () => ({
    entries: [],
    sidebarOpen: false,
    lastError: null,
    selectedEntryId: null,
    toggleHistorySidebar: vi.fn(),
    closeHistorySidebar: vi.fn(),
    clearError: vi.fn(),
    selectHistoryEntry: vi.fn(),
    clearHistory: vi.fn().mockReturnValue(true),
    deleteHistoryEntry: vi.fn().mockReturnValue(true),
  }),
}));

import App from "../App.vue";

describe("App", () => {
  it("initializes theme, locale, and config stores on mount", async () => {
    setActivePinia(createPinia());
    initTheme.mockClear();
    initLocale.mockClear();
    initConfig.mockClear();

    mount(App, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          AppHeader: true,
          "router-view": true,
        },
      },
    });

    expect(initTheme).toHaveBeenCalledTimes(1);
    expect(initLocale).toHaveBeenCalledTimes(1);
    expect(initConfig).toHaveBeenCalledTimes(1);
  });

  it("renders v-app shell with header and router-view", () => {
    setActivePinia(createPinia());
    const wrapper = mount(App, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          AppHeader: { template: '<div class="app-header-stub" />' },
          "router-view": { template: '<div class="rv-stub" />' },
        },
      },
    });

    expect(wrapper.find(".app-header-stub").exists()).toBe(true);
    expect(wrapper.find(".rv-stub").exists()).toBe(true);
  });
});
