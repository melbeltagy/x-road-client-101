import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Brand from "../Brand.vue";
import { createTestI18n } from "@/test/i18n";

describe("Brand", () => {
  it("renders the global title from i18n inside a link to /", () => {
    const wrapper = mount(Brand, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          "router-link": { template: '<a class="brand-link" :href="to"><slot /></a>', props: ["to"] },
        },
      },
    });

    // From en.json global.title
    expect(wrapper.text()).toContain("X-Road Client 101");

    const link = wrapper.find("a.brand-link");
    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toBe("/");
  });
});
