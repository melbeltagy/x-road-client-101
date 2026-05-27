import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ServiceSection from "../ServiceSection.vue";
import type { SubsystemId, ServiceInfo } from "@/types";
import { createTestI18n } from "@/test/i18n";

const emptySubsystem: SubsystemId = { instanceId: "", memberClass: "", memberCode: "", subsystemCode: "" };
const fullSubsystem: SubsystemId = { instanceId: "TEST", memberClass: "GOV", memberCode: "111", subsystemCode: "A" };

function mountSection(propsOverride: Record<string, unknown> = {}) {
  return mount(ServiceSection, {
    props: {
      subsystem: emptySubsystem,
      serviceCode: "",
      serviceVersion: "",
      errors: {},
      ...propsOverride,
    } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        SubsystemIdFields: {
          props: ["prefix", "instanceId", "memberClass", "memberCode", "subsystemCode", "errors", "suggestions"],
          template: '<div class="subsystem-stub" :data-prefix="prefix" @click="$emit(\'update:member-code\', \'999\')" />',
          emits: ["update:instance-id", "update:member-class", "update:member-code", "update:subsystem-code", "select"],
        },
        ClearButton: {
          template: '<button class="clear-stub" @click="$emit(\'click\')">clear</button>',
          emits: ["click"],
        },
      },
    },
  });
}

describe("ServiceSection", () => {
  it("emits clear on clear button click", async () => {
    const wrapper = mountSection();
    await wrapper.find(".clear-stub").trigger("click");
    expect(wrapper.emitted("clear")).toBeTruthy();
  });

  it("uses prefix 'service' for the subsystem fields", () => {
    const wrapper = mountSection();
    expect(wrapper.find(".subsystem-stub").attributes("data-prefix")).toBe("service");
  });

  it("forwards a SubsystemIdFields update with the existing subsystem fields preserved", async () => {
    const wrapper = mountSection({ subsystem: fullSubsystem });
    await wrapper.find(".subsystem-stub").trigger("click");
    const events = wrapper.emitted("update:subsystem");
    expect(events).toBeTruthy();
    expect(events![0][0]).toEqual({ ...fullSubsystem, memberCode: "999" });
  });

  it("falls back to a v-text-field when no service options are available", () => {
    const wrapper = mountSection();
    // No combobox in DOM; instead a text field with id=serviceCode.
    expect(wrapper.find(".v-combobox").exists()).toBe(false);
    expect(wrapper.find("#serviceCode").exists()).toBe(true);
  });

  it("shows the v-combobox when service options are available", () => {
    const availableServices: ServiceInfo[] = [
      { serviceCode: "getInfo", serviceType: "REST", endpoints: [] },
      { serviceCode: "listItems", serviceType: "REST", endpoints: [] },
    ];
    const wrapper = mountSection({ availableServices });
    expect(wrapper.find(".v-combobox").exists()).toBe(true);
  });

  it("emits update:serviceVersion when the version field changes", async () => {
    const wrapper = mountSection();
    await wrapper.find("#serviceVersion").setValue("v2");
    expect(wrapper.emitted("update:serviceVersion")?.[0]).toEqual(["v2"]);
  });

  it("emits update:serviceCode when the text fallback field changes", async () => {
    const wrapper = mountSection();
    await wrapper.find("#serviceCode").setValue("doStuff");
    expect(wrapper.emitted("update:serviceCode")?.[0]).toEqual(["doStuff"]);
  });
});
