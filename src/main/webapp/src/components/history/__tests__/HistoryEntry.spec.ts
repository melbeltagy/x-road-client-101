import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HistoryEntry from "../HistoryEntry.vue";
import type { RequestHistoryEntry } from "@/stores/xroad-history";
import { createTestI18n } from "@/test/i18n";

const baseEntry: RequestHistoryEntry = {
  id: "e1",
  timestamp: "2025-01-01T12:00:00Z",
  request: {
    client: {
      subsystem: { instanceId: "TEST", memberClass: "GOV", memberCode: "111", subsystemCode: "C" },
      securityServerUrl: "https://ss.example.com",
    },
    service: {
      subsystem: { instanceId: "TEST", memberClass: "GOV", memberCode: "222", subsystemCode: "S" },
      serviceCode: "getInfo",
    },
    request: { method: "GET", path: "/api/data" },
  },
  response: {
    statusCode: 200,
    statusText: "OK",
    timestamp: "2025-01-01T12:00:01Z",
  },
};

function mountEntry(entry: RequestHistoryEntry = baseEntry, isSelected = false) {
  return mount(HistoryEntry, {
    props: { entry, isSelected } as never,
    global: { plugins: [createTestI18n()] },
  });
}

describe("HistoryEntry", () => {
  it("renders the response status chip when a response exists", () => {
    const wrapper = mountEntry();
    expect(wrapper.find(".v-chip").exists()).toBe(true);
    expect(wrapper.find(".v-chip").text()).toContain("200");
  });

  it("does not render a status chip when response is null", () => {
    const wrapper = mountEntry({ ...baseEntry, response: null });
    // chip is only shown when entry.response exists.
    const chips = wrapper.findAll(".v-chip");
    expect(chips.length).toBe(0);
  });

  it("renders the client identifier and method", () => {
    const wrapper = mountEntry();
    const text = wrapper.text();
    // The formatted client should contain the parts of the subsystem id.
    expect(text).toContain("TEST");
    expect(text).toContain("GOV");
    expect(text).toContain("111");
    expect(text).toContain("GET");
  });

  it("emits view with the entry when clicked", async () => {
    const wrapper = mountEntry();
    await wrapper.find(".history-entry").trigger("click");
    const events = wrapper.emitted("view");
    expect(events).toBeTruthy();
    expect(events![0][0]).toEqual(baseEntry);
  });

  it("emits delete with the entry id and stops propagation", async () => {
    const wrapper = mountEntry();
    const deleteBtn = wrapper.find('button[title="Delete"]');
    await deleteBtn.trigger("click");

    const deleteEvents = wrapper.emitted("delete");
    expect(deleteEvents).toBeTruthy();
    expect(deleteEvents![0]).toEqual(["e1"]);

    // The click should not have bubbled — view should not have fired.
    expect(wrapper.emitted("view")).toBeFalsy();
  });

  it("applies the active state when isSelected is true", () => {
    const wrapper = mountEntry(baseEntry, true);
    // VListItem renders an `--active` class when :active is true.
    expect(wrapper.html()).toContain("v-list-item--active");
  });
});
