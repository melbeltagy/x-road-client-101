import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { ref } from "vue";

// Mock Vuetify useTheme before importing the store
vi.mock("vuetify", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useTheme: () => ({
      global: {
        name: ref("light"),
      },
    }),
  };
});

import { useThemeStore } from "../theme";

describe("Theme Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("initial state", () => {
    it("should have system as default theme mode", () => {
      const store = useThemeStore();
      expect(store.themeMode).toBe("system");
    });
  });

  describe("setThemeMode", () => {
    it("should set theme to light", () => {
      const store = useThemeStore();
      store.setThemeMode("light");
      expect(store.themeMode).toBe("light");
    });

    it("should set theme to dark", () => {
      const store = useThemeStore();
      store.setThemeMode("dark");
      expect(store.themeMode).toBe("dark");
    });

    it("should set theme to system", () => {
      const store = useThemeStore();
      store.setThemeMode("light");
      store.setThemeMode("system");
      expect(store.themeMode).toBe("system");
    });
  });

  describe("effectiveTheme", () => {
    it("should return light when theme mode is light", () => {
      const store = useThemeStore();
      store.setThemeMode("light");
      expect(store.effectiveTheme).toBe("light");
    });

    it("should return dark when theme mode is dark", () => {
      const store = useThemeStore();
      store.setThemeMode("dark");
      expect(store.effectiveTheme).toBe("dark");
    });

    it("should return light by default when system preference is not dark", () => {
      const store = useThemeStore();
      store.setThemeMode("system");
      // matchMedia is mocked to return matches: false for dark mode
      expect(store.effectiveTheme).toBe("light");
    });
  });

  describe("initializeTheme", () => {
    it("should not throw when initializing", () => {
      const store = useThemeStore();
      expect(() => store.initializeTheme()).not.toThrow();
    });
  });
});
