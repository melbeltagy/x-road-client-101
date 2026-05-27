import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { createTestI18n } from "@/test/i18n";
import type { RequestHistoryEntry } from "@/stores/xroad-history";

const entries = ref<RequestHistoryEntry[]>([]);
const sidebarOpen = ref(true);
const selectedEntryId = ref<string | null>(null);
const lastError = ref<unknown>(null);

const closeHistorySidebar = vi.fn();
const clearHistory = vi.fn(() => true);
const deleteHistoryEntry = vi.fn(() => true);
const clearError = vi.fn(() => {
  lastError.value = null;
});
const selectHistoryEntry = vi.fn();

vi.mock("@/stores/xroad-history", () => ({
  useXRoadHistoryStore: () => ({
    get entries() {
      return entries.value;
    },
    get sidebarOpen() {
      return sidebarOpen.value;
    },
    get selectedEntryId() {
      return selectedEntryId.value;
    },
    get lastError() {
      return lastError.value;
    },
    closeHistorySidebar,
    clearHistory,
    deleteHistoryEntry,
    clearError,
    selectHistoryEntry,
  }),
}));

import HistoryList from "../HistoryList.vue";

function mountList() {
  return mount(HistoryList, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        // Drawer would teleport; stub so its slots render inline.
        VNavigationDrawer: {
          props: ["modelValue"],
          template: '<aside class="drawer-stub" :data-open="modelValue"><slot name="prepend" /><slot /></aside>',
          emits: ["update:modelValue"],
        },
        HistoryEntry: {
          props: ["entry", "isSelected"],
          template:
            '<div class="entry-stub" :data-id="entry.id" :data-selected="isSelected" @click="$emit(\'view\', entry)" @dblclick="$emit(\'delete\', entry.id)" />',
          emits: ["view", "delete"],
        },
        ConfirmDialog: {
          props: ["modelValue", "message", "color"],
          template:
            '<div class="confirm-stub" :data-open="modelValue" @click="$emit(\'confirm\')" @dblclick="$emit(\'update:modelValue\', false)" />',
          emits: ["update:modelValue", "confirm"],
        },
      },
    },
  });
}

function makeEntry(id: string): RequestHistoryEntry {
  return {
    id,
    timestamp: "2025-01-01T00:00:00Z",
    request: {
      client: {
        subsystem: { instanceId: "T", memberClass: "G", memberCode: "1", subsystemCode: "C" },
        securityServerUrl: "https://x",
      },
      service: {
        subsystem: { instanceId: "T", memberClass: "G", memberCode: "2", subsystemCode: "S" },
        serviceCode: "svc",
      },
      request: { method: "GET", path: "/p" },
    },
    response: null,
  };
}

describe("HistoryList", () => {
  it("shows the empty-state copy when there are no entries", () => {
    entries.value = [];
    const wrapper = mountList();
    // From en.json: xroad.history.empty / emptyDescription
    expect(wrapper.text()).toContain("No request history yet");
  });

  it("renders one HistoryEntry stub per entry and marks selected", () => {
    entries.value = [makeEntry("a"), makeEntry("b")];
    selectedEntryId.value = "b";

    const wrapper = mountList();
    const stubs = wrapper.findAll(".entry-stub");
    expect(stubs.length).toBe(2);
    expect(stubs[0].attributes("data-selected")).toBe("false");
    expect(stubs[1].attributes("data-selected")).toBe("true");
  });

  it("opens the confirm dialog when Clear All is clicked", async () => {
    entries.value = [makeEntry("a")];
    const wrapper = mountList();
    const clearBtn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("clear all"));
    await clearBtn?.trigger("click");

    const confirmStub = wrapper.find(".confirm-stub");
    expect(confirmStub.attributes("data-open")).toBe("true");
  });

  it("calls clearHistory and closes the sidebar on confirmClearAll", async () => {
    entries.value = [makeEntry("a")];
    lastError.value = null;
    clearHistory.mockClear();
    closeHistorySidebar.mockClear();

    const wrapper = mountList();
    const clearBtn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("clear all"));
    await clearBtn?.trigger("click");
    await wrapper.find(".confirm-stub").trigger("click"); // emits 'confirm'

    expect(clearHistory).toHaveBeenCalled();
    expect(closeHistorySidebar).toHaveBeenCalled();
    expect(wrapper.emitted("showAlert")?.[0]).toEqual(["success", expect.any(String)]);
  });

  it("emits historyWarning when the mutation reports an error", async () => {
    entries.value = [makeEntry("a")];
    lastError.value = { op: "save", message: "boom" };
    clearHistory.mockClear();
    clearError.mockClear();

    const wrapper = mountList();
    const clearBtn = wrapper.findAll("button").find((b) => b.text().toLowerCase().includes("clear all"));
    await clearBtn?.trigger("click");
    await wrapper.find(".confirm-stub").trigger("click");

    expect(clearHistory).toHaveBeenCalled();
    expect(clearError).toHaveBeenCalled();
    expect(wrapper.emitted("historyWarning")).toBeTruthy();
  });

  it("emits view and forwards it to selectHistoryEntry when an entry is clicked", async () => {
    entries.value = [makeEntry("a")];
    selectHistoryEntry.mockClear();

    const wrapper = mountList();
    await wrapper.find(".entry-stub").trigger("click");

    expect(selectHistoryEntry).toHaveBeenCalledWith("a");
    expect(wrapper.emitted("view")).toBeTruthy();
  });

  it("calls deleteHistoryEntry on a delete event", async () => {
    entries.value = [makeEntry("a")];
    deleteHistoryEntry.mockClear();
    lastError.value = null;

    const wrapper = mountList();
    await wrapper.find(".entry-stub").trigger("dblclick"); // stub maps dblclick → emit('delete', id)

    expect(deleteHistoryEntry).toHaveBeenCalledWith("a");
    expect(wrapper.emitted("showAlert")).toBeTruthy();
  });

  it("calls closeHistorySidebar when the close button is clicked", async () => {
    entries.value = [];
    closeHistorySidebar.mockClear();
    const wrapper = mountList();

    // The toolbar close button is the icon-only button with no text.
    const closeBtns = wrapper.findAll("button").filter((b) => b.text() === "");
    await closeBtns[0].trigger("click");
    expect(closeHistorySidebar).toHaveBeenCalled();
  });
});
