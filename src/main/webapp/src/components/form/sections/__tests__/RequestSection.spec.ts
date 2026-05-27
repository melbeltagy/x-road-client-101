import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RequestSection from "../RequestSection.vue";
import type { ServiceEndpoint } from "@/types";
import { createTestI18n } from "@/test/i18n";

function mountSection(propsOverride: Record<string, unknown> = {}) {
  return mount(RequestSection, {
    props: {
      method: "GET",
      path: "/api",
      body: "",
      contentType: "",
      errors: {},
      ...propsOverride,
    } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        ClearButton: {
          template: '<button class="clear-stub" @click="$emit(\'click\')">clear</button>',
          emits: ["click"],
        },
      },
    },
  });
}

describe("RequestSection", () => {
  it("emits 'clear' when the clear button is clicked", async () => {
    const wrapper = mountSection();
    await wrapper.find(".clear-stub").trigger("click");
    expect(wrapper.emitted("clear")).toBeTruthy();
  });

  it("does not show the endpoint autocomplete when no endpoints provided", () => {
    const wrapper = mountSection();
    expect(wrapper.find(".v-autocomplete").exists()).toBe(false);
  });

  it("shows the endpoint autocomplete when endpoints are provided", () => {
    const endpoints: ServiceEndpoint[] = [
      { method: "GET", path: "/users" },
      { method: "POST", path: "/users" },
    ];
    const wrapper = mountSection({ endpoints });
    expect(wrapper.find(".v-autocomplete").exists()).toBe(true);
  });

  it("hides the content-type select when body is empty/whitespace", () => {
    const wrapper = mountSection({ body: "   " });
    // No id="contentType" select rendered.
    expect(wrapper.find("#contentType").exists()).toBe(false);
  });

  it("shows the content-type select once body has content", () => {
    const wrapper = mountSection({ body: "{}" });
    // The select for content type renders.
    expect(wrapper.find("#contentType").exists()).toBe(true);
  });

  it("emits update:body when the textarea changes", async () => {
    const wrapper = mountSection();
    const textarea = wrapper.find("textarea");
    await textarea.setValue("hello body");
    expect(wrapper.emitted("update:body")?.[0]).toEqual(["hello body"]);
  });

  it("emits update:path when the path field changes", async () => {
    const wrapper = mountSection();
    const pathInput = wrapper.find("#path");
    await pathInput.setValue("/v2/api");
    expect(wrapper.emitted("update:path")?.[0]).toEqual(["/v2/api"]);
  });
});
