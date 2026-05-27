import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SectionPanel from "../SectionPanel.vue";
import { createTestI18n } from "@/test/i18n";

function mountPanel(propsOverride: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(SectionPanel, {
    props: {
      value: "client",
      icon: "person",
      title: "Client",
      ...propsOverride,
    },
    slots: {
      default: '<div class="body-content">Inner body</div>',
      ...slots,
    },
    global: {
      plugins: [createTestI18n()],
      // Render expansion panel content eagerly so the body is in the DOM.
      stubs: {
        VExpansionPanel: { template: '<div class="v-expansion-panel-stub" :class="$attrs.class"><slot /></div>' },
        VExpansionPanelTitle: { template: '<div class="v-expansion-panel-title-stub"><slot /></div>' },
        VExpansionPanelText: { template: '<div class="v-expansion-panel-text-stub"><slot /></div>' },
      },
    },
  });
}

describe("SectionPanel", () => {
  it("renders title, icon, and default slot body", () => {
    const wrapper = mountPanel();
    expect(wrapper.text()).toContain("Client");
    expect(wrapper.html()).toContain("person");
    expect(wrapper.find(".body-content").exists()).toBe(true);
  });

  it("renders the chip slot when provided", () => {
    const wrapper = mountPanel({}, { chip: '<span class="my-chip">chippy</span>' });
    expect(wrapper.find(".my-chip").exists()).toBe(true);
  });

  describe("state styling", () => {
    it.each([
      ["done", "section-done", "success"],
      ["next", "section-next", "warning"],
      ["optional", "section-optional", "grey-lighten-1"],
      ["pending", "section-pending", "primary"],
    ])("state=%s adds the %s class with icon color %s", (state, klass, color) => {
      const wrapper = mountPanel({ state });
      expect(wrapper.find(".v-expansion-panel-stub").classes()).toContain(klass);
      // The icon prepend uses v-icon's `color` attribute; check rendered html includes the color name.
      expect(wrapper.html()).toContain(color);
    });

    it("shows the check_circle completion icon only when state is done", () => {
      expect(mountPanel({ state: "done" }).html()).toContain("check_circle");
      expect(mountPanel({ state: "next" }).html()).not.toContain("check_circle");
      expect(mountPanel({ state: "pending" }).html()).not.toContain("check_circle");
      expect(mountPanel({ state: "optional" }).html()).not.toContain("check_circle");
    });
  });
});
