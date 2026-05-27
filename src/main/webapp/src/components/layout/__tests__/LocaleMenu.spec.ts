import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import LocaleMenu from "../LocaleMenu.vue";
import { createTestI18n } from "@/test/i18n";

const setLocale = vi.fn().mockResolvedValue(undefined);
const currentLocale = ref<"en" | "et">("en");

vi.mock("@/stores/locale", () => ({
  useLocaleStore: () => ({
    get currentLocale() {
      return currentLocale.value;
    },
    setLocale,
  }),
  SUPPORTED_LOCALES: [
    { code: "en", name: "English" },
    { code: "et", name: "Eesti" },
  ],
}));

describe("LocaleMenu", () => {
  it("renders the activator button with the translate icon", () => {
    const wrapper = mount(LocaleMenu, { global: { plugins: [createTestI18n()] } });
    expect(wrapper.html()).toContain("translate");
  });
});
