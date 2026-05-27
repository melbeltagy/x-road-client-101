import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import { useNotifications } from "../useNotifications";
import { useXRoadHistoryStore } from "@/stores/xroad-history";

describe("useNotifications", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("starts with both alerts hidden", () => {
    const { alert, historyAlert } = useNotifications();
    expect(alert.value.show).toBe(false);
    expect(historyAlert.value.show).toBe(false);
  });

  describe("primary alert channel", () => {
    it("showAlert sets show=true with the provided type + message", () => {
      const { alert, showAlert } = useNotifications();
      showAlert("error", "something broke");

      expect(alert.value).toEqual({ show: true, type: "error", message: "something broke" });
    });

    it("hidePrimaryAlert flips show=false, leaving the message intact", () => {
      const { alert, showAlert, hidePrimaryAlert } = useNotifications();
      showAlert("success", "done");
      hidePrimaryAlert();

      expect(alert.value.show).toBe(false);
      expect(alert.value.message).toBe("done");
    });

    it("showAlert can be called repeatedly with new content", () => {
      const { alert, showAlert } = useNotifications();
      showAlert("success", "first");
      showAlert("warning", "second");

      expect(alert.value.type).toBe("warning");
      expect(alert.value.message).toBe("second");
    });
  });

  describe("history-warning channel", () => {
    it("showHistoryWarning with a message sets that message", () => {
      const { historyAlert, showHistoryWarning } = useNotifications();
      showHistoryWarning("custom");

      expect(historyAlert.value).toEqual({ show: true, message: "custom" });
    });

    it("showHistoryWarning without a message uses the i18n fallback key", () => {
      const { historyAlert, showHistoryWarning } = useNotifications();
      showHistoryWarning();

      // i18n is mocked to return the key — so the message is the key itself.
      expect(historyAlert.value).toEqual({ show: true, message: "xroad.toast.historyError" });
    });
  });

  describe("flushHistoryError", () => {
    it("shows the warning AND clears the store error", () => {
      const store = useXRoadHistoryStore();
      // Force a lastError into the store.
      store.lastError = { op: "save", message: "boom" };

      const { historyAlert, flushHistoryError } = useNotifications();
      flushHistoryError();

      expect(historyAlert.value.show).toBe(true);
      expect(store.lastError).toBeNull();
    });
  });

  it("the primary and history channels are independent", () => {
    const { alert, historyAlert, showAlert, showHistoryWarning } = useNotifications();
    showAlert("success", "a");
    showHistoryWarning("b");

    expect(alert.value.show).toBe(true);
    expect(historyAlert.value.show).toBe(true);
    expect(alert.value.message).toBe("a");
    expect(historyAlert.value.message).toBe("b");
  });
});
