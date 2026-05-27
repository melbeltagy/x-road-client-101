import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import ThemeToggle from "../ThemeToggle.vue";
import { createTestI18n } from "@/test/i18n";

const setThemeMode = vi.fn();
const themeMode = ref<"light" | "dark" | "system">("system");

vi.mock("@/stores/theme", () => ({
  useThemeStore: () => ({
    get themeMode() {
      return themeMode.value;
    },
    setThemeMode,
  }),
}));

describe("ThemeToggle", () => {
  it("renders the activator button with the system icon by default", () => {
    setThemeMode.mockClear();
    themeMode.value = "system";

    const wrapper = mount(ThemeToggle, { global: { plugins: [createTestI18n()] } });

    // The activator button should be visible; system → "computer" icon class
    expect(wrapper.html()).toContain("computer");
  });

  it("uses light_mode icon when mode is light", () => {
    themeMode.value = "light";
    const wrapper = mount(ThemeToggle, { global: { plugins: [createTestI18n()] } });
    expect(wrapper.html()).toContain("light_mode");
  });

  it("uses dark_mode icon when mode is dark", () => {
    themeMode.value = "dark";
    const wrapper = mount(ThemeToggle, { global: { plugins: [createTestI18n()] } });
    expect(wrapper.html()).toContain("dark_mode");
  });
});
