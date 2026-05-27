import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ClientSection from "../ClientSection.vue";
import type { SubsystemId } from "@/types";
import { createTestI18n } from "@/test/i18n";

const subsystem: SubsystemId = { instanceId: "", memberClass: "", memberCode: "", subsystemCode: "" };
const fullSubsystem: SubsystemId = { instanceId: "TEST", memberClass: "GOV", memberCode: "111", subsystemCode: "A" };

function mountSection(propsOverride: Record<string, unknown> = {}) {
  return mount(ClientSection, {
    props: {
      subsystem,
      securityServerUrl: "",
      errors: {},
      ...propsOverride,
    } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        SubsystemIdFields: {
          props: ["prefix", "instanceId", "memberClass", "memberCode", "subsystemCode", "errors", "suggestions"],
          template: '<div class="subsystem-stub" :data-prefix="prefix" @click="$emit(\'update:instance-id\', \'XX\')" />',
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

describe("ClientSection", () => {
  it("renders ClearButton and SubsystemIdFields with prefix 'client'", () => {
    const wrapper = mountSection();
    expect(wrapper.find(".clear-stub").exists()).toBe(true);
    expect(wrapper.find(".subsystem-stub").attributes("data-prefix")).toBe("client");
  });

  it("emits 'clear' when the clear button is clicked", async () => {
    const wrapper = mountSection();
    await wrapper.find(".clear-stub").trigger("click");
    expect(wrapper.emitted("clear")).toBeTruthy();
  });

  it("forwards SubsystemIdFields field updates with the existing subsystem fields preserved", async () => {
    const wrapper = mountSection({ subsystem: fullSubsystem });
    await wrapper.find(".subsystem-stub").trigger("click"); // emits update:instance-id with "XX"

    const updates = wrapper.emitted("update:subsystem");
    expect(updates).toBeTruthy();
    expect(updates![0][0]).toEqual({ ...fullSubsystem, instanceId: "XX" });
  });
});
