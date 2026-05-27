import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestI18n } from "@/test/i18n";
import type { XRoadResponse } from "@/types";

vi.mock("@/stores/theme", () => ({
  useThemeStore: () => ({ effectiveTheme: "light" }),
}));

import XRoadResponseViewer from "../XRoadResponseViewer.vue";

function mountViewer(response: XRoadResponse | null) {
  return mount(XRoadResponseViewer, {
    props: { response } as never,
    global: {
      plugins: [createTestI18n()],
      stubs: {
        // Stub the children so we can assert what's passed without running their own logic.
        ResponseStatusSection: {
          props: ["statusCode", "statusText", "timestamp", "contentType", "contentLength"],
          template: '<div class="status-stub" :data-code="statusCode" :data-ct="contentType" />',
        },
        ResponseBodySection: {
          props: ["body", "contentType", "effectiveTheme"],
          template: '<div class="body-stub" :data-body="body" :data-theme="effectiveTheme" />',
        },
        CollapsibleHeadersSection: {
          props: ["titleKey", "headers", "panelValue", "defaultOpen", "emptyMessageKey"],
          template: '<div class="hdr-stub" :data-panel="panelValue" :data-headers="JSON.stringify(headers)" />',
        },
        ResponseXRoadErrorSection: {
          props: ["xroadError"],
          template: "<div class=\"err-stub\" :data-has-error=\"xroadError ? 'yes' : 'no'\" />",
        },
        VExpansionPanels: { template: '<div class="vep"><slot /></div>' },
      },
    },
  });
}

const baseResponse: XRoadResponse = {
  statusCode: 200,
  statusText: "OK",
  timestamp: "2025-01-01T12:00:00Z",
  contentType: "application/json",
  contentLength: 12,
  body: '{"ok":1}',
  headers: {
    "X-Road-Id": ["abc-123"],
    "X-Road-Request-Hash": ["hash"],
    "Content-Type": ["application/json"],
    "Cache-Control": ["no-store"],
  },
};

describe("XRoadResponseViewer", () => {
  it("shows the 'no response' alert when response is null", () => {
    const wrapper = mountViewer(null);
    expect(wrapper.find(".v-alert").exists()).toBe(true);
    expect(wrapper.find(".status-stub").exists()).toBe(false);
  });

  it("renders the status/body/header sub-sections when a response exists", () => {
    const wrapper = mountViewer(baseResponse);
    expect(wrapper.find(".v-alert").exists()).toBe(false);
    expect(wrapper.find(".status-stub").attributes("data-code")).toBe("200");
    expect(wrapper.find(".body-stub").attributes("data-body")).toBe('{"ok":1}');
    expect(wrapper.find(".body-stub").attributes("data-theme")).toBe("light");
  });

  it("splits X-Road headers from regular HTTP headers", () => {
    const wrapper = mountViewer(baseResponse);
    const stubs = wrapper.findAll(".hdr-stub");
    expect(stubs.length).toBe(2);

    const xroadPanel = stubs.find((s) => s.attributes("data-panel") === "xroad-headers");
    const httpPanel = stubs.find((s) => s.attributes("data-panel") === "http-headers");
    expect(xroadPanel).toBeDefined();
    expect(httpPanel).toBeDefined();

    const xroadHeaders = JSON.parse(xroadPanel!.attributes("data-headers")!);
    const httpHeaders = JSON.parse(httpPanel!.attributes("data-headers")!);

    expect(Object.keys(xroadHeaders)).toEqual(expect.arrayContaining(["X-Road-Id", "X-Road-Request-Hash"]));
    expect(Object.keys(httpHeaders)).toEqual(expect.arrayContaining(["Content-Type", "Cache-Control"]));
    expect(Object.keys(httpHeaders)).not.toContain("X-Road-Id");
  });

  it("expands multi-value HTTP headers into key[N] entries", () => {
    const wrapper = mountViewer({
      ...baseResponse,
      headers: { "Set-Cookie": ["a=1", "b=2"] },
    });
    const httpPanel = wrapper.findAll(".hdr-stub").find((s) => s.attributes("data-panel") === "http-headers")!;
    const headers = JSON.parse(httpPanel.attributes("data-headers")!);

    expect(headers).toEqual({
      "Set-Cookie[0]": "a=1",
      "Set-Cookie[1]": "b=2",
    });
  });

  it("expands multi-value X-Road headers into key[N] entries", () => {
    const wrapper = mountViewer({
      ...baseResponse,
      headers: { "X-Road-Trace": ["t1", "t2"] },
    });
    const panel = wrapper.findAll(".hdr-stub").find((s) => s.attributes("data-panel") === "xroad-headers")!;
    const headers = JSON.parse(panel.attributes("data-headers")!);
    expect(headers).toEqual({ "X-Road-Trace[0]": "t1", "X-Road-Trace[1]": "t2" });
  });

  it("forwards xroadError to the error section", () => {
    const wrapper = mountViewer({
      ...baseResponse,
      xroadError: { type: "T", message: "boom" },
    });
    expect(wrapper.find(".err-stub").attributes("data-has-error")).toBe("yes");
  });
});
