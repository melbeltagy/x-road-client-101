import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import AppHeader from "../AppHeader.vue";
import { createTestI18n } from "@/test/i18n";

const toggleHistorySidebar = vi.fn();

vi.mock("@/stores/xroad-history", () => ({
  useXRoadHistoryStore: () => ({
    toggleHistorySidebar,
  }),
}));

vi.mock("@/stores/theme", () => ({
  useThemeStore: () => ({ themeMode: "system", setThemeMode: vi.fn() }),
}));

vi.mock("@/stores/locale", () => ({
  useLocaleStore: () => ({ currentLocale: "en", setLocale: vi.fn() }),
  SUPPORTED_LOCALES: [{ code: "en", name: "English" }],
}));

function mountHeader() {
  return mount(AppHeader, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        Brand: { template: '<div class="brand-stub" />' },
        ThemeToggle: { template: '<div class="theme-stub" />' },
        LocaleMenu: { template: '<div class="locale-stub" />' },
        // VAppBar needs a v-layout ancestor in production; stub it here so we can mount in isolation.
        VAppBar: {
          template: '<header class="v-app-bar-stub"><slot /><slot name="extension" /></header>',
        },
      },
    },
  });
}

describe("AppHeader", () => {
  it("renders Brand, ThemeToggle, and LocaleMenu", () => {
    const wrapper = mountHeader();
    expect(wrapper.find(".brand-stub").exists()).toBe(true);
    expect(wrapper.find(".theme-stub").exists()).toBe(true);
    expect(wrapper.find(".locale-stub").exists()).toBe(true);
  });

  it("calls toggleHistorySidebar when the history button is clicked", async () => {
    toggleHistorySidebar.mockClear();
    const wrapper = mountHeader();

    const historyBtn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("history"));
    expect(historyBtn).toBeDefined();

    await historyBtn?.trigger("click");
    expect(toggleHistorySidebar).toHaveBeenCalledTimes(1);
  });

  it("toggles the mobile-nav extension panel when the nav icon is clicked", async () => {
    const wrapper = mountHeader();

    // Initially no v-sheet (extension) rendered
    expect(wrapper.find(".v-sheet").exists()).toBe(false);

    const navToggle = wrapper.find('button[aria-label="Menu"]');
    expect(navToggle.exists()).toBe(true);
    await navToggle.trigger("click");

    // After toggle the extension slot v-sheet should be rendered with a duplicate history button.
    const historyButtons = wrapper.findAll("button").filter((b) => b.text().toLowerCase().includes("history"));
    expect(historyButtons.length).toBeGreaterThanOrEqual(2);
  });
});
