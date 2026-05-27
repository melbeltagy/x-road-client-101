import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ResponseStatusSection from "../ResponseStatusSection.vue";
import { createTestI18n } from "@/test/i18n";

function mountSection(props: Record<string, unknown>) {
  return mount(ResponseStatusSection, {
    props: {
      statusCode: 200,
      statusText: "OK",
      timestamp: "2025-01-01T12:00:00Z",
      ...props,
    } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        VExpansionPanel: { template: '<div><slot /></div>' },
        VExpansionPanelTitle: { template: '<div><slot /></div>' },
        VExpansionPanelText: { template: '<div><slot /></div>' },
      },
    },
  });
}

describe("ResponseStatusSection", () => {
  it("renders 'status code statusText' for non-zero codes", () => {
    const wrapper = mountSection({ statusCode: 200, statusText: "OK" });
    expect(wrapper.text()).toContain("200 OK");
  });

  it("renders the localized 'Error' label when statusCode is 0", () => {
    const wrapper = mountSection({ statusCode: 0, statusText: "" });
    // The chip displays the localized error string instead of "0 ...".
    const html = wrapper.html();
    // The v-chip body should contain "Error" but not literal "0 " followed by empty status text.
    expect(html).toContain("Error");
    // The chip text shouldn't include "0 " — but the timestamp can. Scope to the chip.
    const chip = wrapper.find(".v-chip");
    expect(chip.text()).toContain("Error");
    expect(chip.text()).not.toMatch(/^0\b/);
  });

  it("shows contentType row only when provided", () => {
    const withCt = mountSection({ contentType: "application/json" });
    expect(withCt.text()).toContain("application/json");

    const without = mountSection({});
    expect(without.text()).not.toContain("application/json");
  });

  it("shows contentLength row with human size only when provided", () => {
    const withLen = mountSection({ contentLength: 2048 });
    // 2048 bytes → 2.00 KB via toHumanReadableSize.
    expect(withLen.text()).toContain("2.00 KB");

    const without = mountSection({ contentLength: null });
    expect(without.text()).not.toContain("KB");
  });

  it("renders a formatted timestamp", () => {
    const wrapper = mountSection({ timestamp: "2025-06-15T08:30:00Z" });
    // toLocaleString depends on the runtime; just assert that some part of the date appears.
    expect(wrapper.text()).toMatch(/202[0-9]/);
  });
});
