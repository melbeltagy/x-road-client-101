import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ResponseBodySection from "../ResponseBodySection.vue";
import { createTestI18n } from "@/test/i18n";

function mountSection(props: Record<string, unknown> = {}) {
  return mount(ResponseBodySection, {
    props: {
      effectiveTheme: "light",
      ...props,
    } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        VExpansionPanel: { template: "<div><slot /></div>" },
        VExpansionPanelTitle: { template: "<div><slot /></div>" },
        VExpansionPanelText: { template: "<div><slot /></div>" },
      },
    },
  });
}

describe("ResponseBodySection", () => {
  it("shows a 'no body' message when body is empty", () => {
    const wrapper = mountSection({ body: "" });
    // pre block should not be rendered when there's no body.
    expect(wrapper.find("pre.response-body-pre").exists()).toBe(false);
    expect(wrapper.text().length).toBeGreaterThan(0);
  });

  it("renders the raw body as preformatted text", () => {
    const wrapper = mountSection({ body: "hello\nworld" });
    const pre = wrapper.find("pre.response-body-pre");
    expect(pre.exists()).toBe(true);
    expect(pre.text()).toContain("hello");
    expect(pre.text()).toContain("world");
  });

  it("applies the dark-theme class when effectiveTheme is dark", () => {
    const wrapper = mountSection({ body: "x", effectiveTheme: "dark" });
    expect(wrapper.find("pre.dark-theme").exists()).toBe(true);
  });

  it("renders the body size in the title row", () => {
    const wrapper = mountSection({ body: "abcdef" });
    expect(wrapper.text()).toContain("6 B");
  });

  it("shows the JSON/Raw toggle only when content is valid JSON", () => {
    const valid = mountSection({ body: '{"a":1}', contentType: "application/json" });
    const validLabels = valid.findAll("button").map((b) => b.text());
    expect(validLabels).toContain("Raw");
    expect(validLabels).toContain("JSON Format");

    const invalid = mountSection({ body: "not json", contentType: "application/json" });
    const labels = invalid.findAll("button").map((b) => b.text());
    expect(labels).not.toContain("JSON Format");
    expect(labels).not.toContain("Raw");
  });
});
