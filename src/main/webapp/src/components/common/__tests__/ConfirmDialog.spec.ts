import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ConfirmDialog from "../ConfirmDialog.vue";
import { createTestI18n } from "@/test/i18n";

function mountDialog(propsOverride: Record<string, unknown> = {}) {
  return mount(ConfirmDialog, {
    props: {
      modelValue: true,
      message: "Are you sure?",
      ...propsOverride,
    },
    global: {
      plugins: [createTestI18n()],
      // Stub VDialog to render content inline (avoids teleport).
      stubs: {
        VDialog: { template: '<div class="v-dialog-stub"><slot /></div>' },
      },
    },
  });
}

describe("ConfirmDialog", () => {
  describe("rendering", () => {
    it("renders the message", () => {
      const wrapper = mountDialog();
      expect(wrapper.text()).toContain("Are you sure?");
    });

    it("renders the title when provided", () => {
      const wrapper = mountDialog({ title: "Heads up" });
      expect(wrapper.text()).toContain("Heads up");
    });

    it("renders default Cancel/Confirm labels from i18n", () => {
      const wrapper = mountDialog();
      const labels = wrapper.findAll("button").map((b) => b.text());
      expect(labels).toContain("Cancel");
      expect(labels).toContain("Confirm");
    });

    it("uses confirmLabel/cancelLabel overrides when provided", () => {
      const wrapper = mountDialog({ confirmLabel: "Yes, do it", cancelLabel: "Nope" });
      const labels = wrapper.findAll("button").map((b) => b.text());
      expect(labels).toContain("Yes, do it");
      expect(labels).toContain("Nope");
      expect(labels).not.toContain("Cancel");
      expect(labels).not.toContain("Confirm");
    });
  });

  describe("events", () => {
    it("emits cancel + update:modelValue=false on Cancel click", async () => {
      const wrapper = mountDialog();
      const cancelBtn = wrapper.findAll("button").find((b) => b.text() === "Cancel");
      await cancelBtn?.trigger("click");

      expect(wrapper.emitted("cancel")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    });

    it("emits confirm + update:modelValue=false on Confirm click", async () => {
      const wrapper = mountDialog();
      const confirmBtn = wrapper.findAll("button").find((b) => b.text() === "Confirm");
      await confirmBtn?.trigger("click");

      expect(wrapper.emitted("confirm")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    });
  });
});
