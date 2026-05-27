import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AppNotifications from "../AppNotifications.vue";
import { createTestI18n } from "@/test/i18n";
import type { AlertType } from "@/composables";

const defaults = {
  alert: { show: false, type: "success" as AlertType, message: "Hello" },
  historyAlert: { show: false, message: "Warn" },
};

function mountNotifications(props: Partial<typeof defaults> = {}) {
  return mount(AppNotifications, {
    props: { ...defaults, ...props } as never,
    global: {
      plugins: [createTestI18n()],
      // VSnackbar would teleport to body and never render content in jsdom; stub it.
      stubs: {
        VSnackbar: {
          props: ["modelValue", "color"],
          template: '<div class="snackbar-stub" :data-show="modelValue" :data-color="color"><slot /><slot name="actions" /></div>',
        },
      },
    },
  });
}

describe("AppNotifications", () => {
  it("renders both snackbars with the supplied show/color/message", () => {
    const wrapper = mountNotifications({
      alert: { show: true, type: "error", message: "Boom" },
      historyAlert: { show: true, message: "History err" },
    });

    const stubs = wrapper.findAll(".snackbar-stub");
    expect(stubs.length).toBe(2);
    expect(stubs[0].attributes("data-show")).toBe("true");
    expect(stubs[0].attributes("data-color")).toBe("error");
    expect(wrapper.text()).toContain("Boom");
    expect(wrapper.text()).toContain("History err");
  });

  it("emits update:alertShow=false when the primary close button is clicked", async () => {
    const wrapper = mountNotifications({
      alert: { show: true, type: "info", message: "msg" },
    });

    // Each snackbar renders a close button inside its actions slot (4 close icons total? no — 1 per snackbar).
    const closeButtons = wrapper.findAll("button");
    await closeButtons[0].trigger("click");

    expect(wrapper.emitted("update:alertShow")).toBeTruthy();
    expect(wrapper.emitted("update:alertShow")?.[0]).toEqual([false]);
  });

  it("emits update:historyAlertShow=false when the secondary close button is clicked", async () => {
    const wrapper = mountNotifications({
      historyAlert: { show: true, message: "Hist msg" },
    });

    const closeButtons = wrapper.findAll("button");
    // Second snackbar's button — the primary stub has no message but still renders its action button.
    await closeButtons[1].trigger("click");

    expect(wrapper.emitted("update:historyAlertShow")).toBeTruthy();
    expect(wrapper.emitted("update:historyAlertShow")?.[0]).toEqual([false]);
  });
});
