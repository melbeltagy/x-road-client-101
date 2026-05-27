import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ClearButton from "../ClearButton.vue";
import { createTestI18n } from "@/test/i18n";

describe("ClearButton", () => {
  it("renders with translated 'Clear' label and delete icon", () => {
    const wrapper = mount(ClearButton, { global: { plugins: [createTestI18n()] } });
    expect(wrapper.text()).toContain("Clear");
    expect(wrapper.html()).toContain("delete");
  });

  it("passes the title prop through as the button's title attribute", () => {
    const wrapper = mount(ClearButton, {
      props: { title: "Clear all things" },
      global: { plugins: [createTestI18n()] },
    });
    const btn = wrapper.find("button");
    expect(btn.attributes("title")).toBe("Clear all things");
  });

  it("emits 'click' when the button is clicked", async () => {
    const wrapper = mount(ClearButton, { global: { plugins: [createTestI18n()] } });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
    expect(wrapper.emitted("click")?.length).toBe(1);
  });
});
