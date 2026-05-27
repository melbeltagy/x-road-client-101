import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SectionStatusChip from "../SectionStatusChip.vue";

function mountChip(props: Record<string, unknown>) {
  return mount(SectionStatusChip, { props: props as never });
}

describe("SectionStatusChip", () => {
  describe("precedence (loading > success > error > info)", () => {
    it("shows progress spinner when loading", () => {
      const wrapper = mountChip({
        loading: true,
        successCount: 5,
        successText: "success!",
        error: "failed",
        infoText: "info",
      });
      expect(wrapper.findComponent({ name: "VProgressCircular" }).exists()).toBe(true);
      expect(wrapper.text()).not.toContain("success!");
      expect(wrapper.text()).not.toContain("failed");
      expect(wrapper.text()).not.toContain("info");
    });

    it("shows success chip when not loading and successCount > 0", () => {
      const wrapper = mountChip({
        loading: false,
        successCount: 3,
        successText: "3 items",
        error: "failed",
      });
      expect(wrapper.text()).toContain("3 items");
      expect(wrapper.text()).not.toContain("failed");
    });

    it("shows error chip when no loading + no success + error present", () => {
      const wrapper = mountChip({
        loading: false,
        successCount: 0,
        successText: "unused",
        error: "Could not fetch",
        infoText: "unused-info",
      });
      expect(wrapper.text()).toContain("Could not fetch");
      expect(wrapper.text()).not.toContain("unused-info");
    });

    it("shows info chip as the lowest-priority fallback", () => {
      const wrapper = mountChip({
        loading: false,
        successCount: 0,
        error: null,
        infoText: "Service not found",
      });
      expect(wrapper.text()).toContain("Service not found");
    });
  });

  describe("no-render conditions", () => {
    it("renders nothing when no inputs activate", () => {
      const wrapper = mountChip({
        loading: false,
        successCount: 0,
        error: null,
        infoText: null,
      });
      expect(wrapper.text().trim()).toBe("");
    });

    it("renders nothing when successCount is positive but successText is missing", () => {
      // Both `successCount > 0` AND `successText` are required for the success branch.
      const wrapper = mountChip({
        loading: false,
        successCount: 3,
        successText: undefined,
      });
      expect(wrapper.text().trim()).toBe("");
    });

    it("treats empty-string error as falsy", () => {
      const wrapper = mountChip({
        loading: false,
        successCount: 0,
        error: "",
        infoText: "fallback",
      });
      expect(wrapper.text()).toContain("fallback");
    });
  });
});
