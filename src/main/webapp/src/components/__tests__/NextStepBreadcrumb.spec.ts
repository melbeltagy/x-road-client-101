import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import NextStepBreadcrumb from "../NextStepBreadcrumb.vue";
import { createTestI18n } from "@/test/i18n";

describe("NextStepBreadcrumb", () => {
  it("renders nothing when nextStepKey is null", () => {
    const wrapper = mount(NextStepBreadcrumb, {
      props: { nextStepKey: null },
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.find(".next-step-breadcrumb").exists()).toBe(false);
  });

  it("renders the breadcrumb with the translated step label", () => {
    const wrapper = mount(NextStepBreadcrumb, {
      props: { nextStepKey: "securityServer" },
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.find(".next-step-breadcrumb").exists()).toBe(true);
    expect(wrapper.text()).toContain("Security Server");
  });

  it("emits navigate with the step key when the link is clicked", async () => {
    const wrapper = mount(NextStepBreadcrumb, {
      props: { nextStepKey: "clientIdentifier" },
      global: { plugins: [createTestI18n()] },
    });

    await wrapper.find(".next-link").trigger("click");
    expect(wrapper.emitted("navigate")?.[0]).toEqual(["clientIdentifier"]);
  });
});
