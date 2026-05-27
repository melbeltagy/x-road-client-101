import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ResponseXRoadErrorSection from "../ResponseXRoadErrorSection.vue";
import { createTestI18n } from "@/test/i18n";

describe("ResponseXRoadErrorSection", () => {
  it("renders nothing when xroadError is undefined", () => {
    const wrapper = mount(ResponseXRoadErrorSection, {
      props: {},
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.find(".v-alert").exists()).toBe(false);
  });

  it("renders type and message for a minimal error", () => {
    const wrapper = mount(ResponseXRoadErrorSection, {
      props: {
        xroadError: { type: "Server.ServerProxy", message: "Service unavailable" },
      },
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.find(".v-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("Server.ServerProxy");
    expect(wrapper.text()).toContain("Service unavailable");
  });

  it("renders detail, faultCode, and faultString when present", () => {
    const wrapper = mount(ResponseXRoadErrorSection, {
      props: {
        xroadError: {
          type: "Type",
          message: "Msg",
          detail: "trace-id-123",
          faultCode: "Server.Server",
          faultString: "Something failed",
        },
      },
      global: { plugins: [createTestI18n()] },
    });
    const text = wrapper.text();
    expect(text).toContain("trace-id-123");
    expect(text).toContain("Server.Server");
    expect(text).toContain("Something failed");
  });

  it("omits optional rows when they are absent", () => {
    const wrapper = mount(ResponseXRoadErrorSection, {
      props: { xroadError: { type: "T", message: "M" } },
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.text()).not.toContain("trace-id-");
    // i18n labels for detail/faultCode/faultString shouldn't appear because their rows are hidden.
    const html = wrapper.html();
    expect(html.toLowerCase()).not.toContain("xroaderrordetail");
  });
});
