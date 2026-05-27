import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CollapsibleHeadersSection from "../CollapsibleHeadersSection.vue";
import { createTestI18n } from "@/test/i18n";

function mountSection(props: Record<string, unknown> = {}) {
  return mount(CollapsibleHeadersSection, {
    props: {
      titleKey: "xroad.response.httpHeaders",
      headers: {},
      panelValue: "p",
      ...props,
    } as never,
    global: {
      plugins: [createTestI18n()],
      // Render expansion content eagerly.
      stubs: {
        VExpansionPanel: { template: '<div class="v-ep-stub" :data-value="value"><slot /></div>', props: ["value"] },
        VExpansionPanelTitle: { template: "<div><slot /></div>" },
        VExpansionPanelText: { template: "<div><slot /></div>" },
      },
    },
  });
}

describe("CollapsibleHeadersSection", () => {
  it("renders nothing when there are no valid headers", () => {
    const wrapper = mountSection({ headers: {} });
    expect(wrapper.find(".v-ep-stub").exists()).toBe(false);
  });

  it("filters out empty / whitespace-only values", () => {
    const wrapper = mountSection({ headers: { "X-Empty": "", "X-Blank": "   ", "X-Real": "value" } });
    const html = wrapper.html();
    expect(html).toContain("X-Real");
    expect(html).toContain("value");
    expect(html).not.toContain("X-Empty");
    expect(html).not.toContain("X-Blank");
  });

  it("renders each surviving header as key: code value pairs", () => {
    const wrapper = mountSection({ headers: { "X-A": "1", "X-B": "2" } });
    const codes = wrapper.findAll("code").map((c) => c.text());
    expect(codes).toContain("1");
    expect(codes).toContain("2");
  });

  it("renders the section using the supplied panelValue", () => {
    const wrapper = mountSection({ headers: { "X-A": "1" }, panelValue: "my-panel" });
    expect(wrapper.find(".v-ep-stub").attributes("data-value")).toBe("my-panel");
  });
});
