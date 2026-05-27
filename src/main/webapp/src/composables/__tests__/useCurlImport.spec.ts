import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref } from "vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import { useCurlImport } from "../useCurlImport";
import type { XRoadRequest } from "@/types";

function buildRequest(): XRoadRequest {
  return {
    client: {
      subsystem: { instanceId: "TEST", memberClass: "GOV", memberCode: "1", subsystemCode: "C" },
      securityServerUrl: "https://ss.example.com",
    },
    service: {
      subsystem: { instanceId: "TEST", memberClass: "GOV", memberCode: "2", subsystemCode: "S" },
      serviceCode: "getInfo",
    },
    request: { method: "GET", path: "/api" },
  };
}

function makeOpts(overrides?: Partial<{ formData: Partial<XRoadRequest> }>) {
  const formData = ref<Partial<XRoadRequest>>(overrides?.formData ?? {});
  const currentRequest = ref<XRoadRequest | null>(null);
  const response = ref<unknown>(null);
  const isFromHistory = ref(false);
  const onSuccess = vi.fn();
  const onWarning = vi.fn();
  return {
    formData,
    currentRequest,
    response,
    isFromHistory,
    onSuccess,
    onWarning,
  };
}

describe("useCurlImport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("open() flips importOpen to true", () => {
    const opts = makeOpts();
    const flow = useCurlImport(opts);
    expect(flow.importOpen.value).toBe(false);
    flow.open();
    expect(flow.importOpen.value).toBe(true);
  });

  describe("handleImport - empty form (no confirmation needed)", () => {
    it("applies the imported request immediately", async () => {
      const opts = makeOpts();
      const flow = useCurlImport(opts);
      const imported = buildRequest();

      flow.handleImport({ request: imported, warnings: [] });

      // applyImportedRequest is async (uses nextTick)
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();

      expect(opts.currentRequest.value).toEqual(imported);
      expect(opts.response.value).toBeNull();
      expect(opts.isFromHistory.value).toBe(false);
      expect(opts.onSuccess).toHaveBeenCalledWith("xroad.curlImport.success");
      expect(flow.replaceConfirmOpen.value).toBe(false);
    });

    it("surfaces warnings via onWarning", async () => {
      const opts = makeOpts();
      const flow = useCurlImport(opts);

      flow.handleImport({
        request: buildRequest(),
        warnings: ["mTLS placeholder", "extra ignored arg"],
      });
      await Promise.resolve();
      await Promise.resolve();

      expect(opts.onWarning).toHaveBeenCalledWith("mTLS placeholder • extra ignored arg");
    });

    it("does not call onWarning when there are no warnings", async () => {
      const opts = makeOpts();
      const flow = useCurlImport(opts);
      flow.handleImport({ request: buildRequest(), warnings: [] });
      await Promise.resolve();
      await Promise.resolve();

      expect(opts.onWarning).not.toHaveBeenCalled();
    });
  });

  describe("handleImport - form has data (confirmation required)", () => {
    it("opens replace-confirm dialog and does NOT apply", () => {
      const opts = makeOpts({ formData: { request: { method: "POST", path: "/x", body: "data" } as never } });
      const flow = useCurlImport(opts);

      flow.handleImport({ request: buildRequest(), warnings: [] });

      expect(flow.replaceConfirmOpen.value).toBe(true);
      expect(opts.currentRequest.value).toBeNull();
      expect(opts.onSuccess).not.toHaveBeenCalled();
    });

    it.each([
      ["securityServerUrl", { client: { securityServerUrl: "https://x" } }],
      ["client subsystem", { client: { subsystem: { instanceId: "TEST" } } }],
      ["service subsystem", { service: { subsystem: { instanceId: "TEST" } } }],
      ["serviceCode", { service: { serviceCode: "getInfo" } }],
      ["serviceVersion", { service: { serviceVersion: "v1" } }],
      ["request body", { request: { body: "b" } }],
      ["request path (non-root)", { request: { path: "/users" } }],
      ["custom headers", { request: { headers: { X: "Y" } } }],
      ["queryParams", { request: { queryParams: { q: "1" } } }],
    ] as Array<[string, Partial<XRoadRequest>]>)('treats %s as "has data"', (_label, formData) => {
      const opts = makeOpts({ formData: formData as Partial<XRoadRequest> });
      const flow = useCurlImport(opts);

      flow.handleImport({ request: buildRequest(), warnings: [] });
      expect(flow.replaceConfirmOpen.value).toBe(true);
    });

    it('a path of "/" alone does NOT count as data', async () => {
      const opts = makeOpts({ formData: { request: { path: "/" } as never } });
      const flow = useCurlImport(opts);

      flow.handleImport({ request: buildRequest(), warnings: [] });
      await Promise.resolve();
      await Promise.resolve();

      // Applied directly — no confirm.
      expect(flow.replaceConfirmOpen.value).toBe(false);
      expect(opts.currentRequest.value).not.toBeNull();
    });

    it("confirmReplaceAndApply applies the pending request", async () => {
      const opts = makeOpts({ formData: { client: { securityServerUrl: "https://x" } as never } });
      const flow = useCurlImport(opts);
      const imported = buildRequest();

      flow.handleImport({ request: imported, warnings: ["w"] });
      expect(flow.replaceConfirmOpen.value).toBe(true);
      expect(opts.currentRequest.value).toBeNull();

      await flow.confirmReplaceAndApply();
      await Promise.resolve();
      await Promise.resolve();

      expect(opts.currentRequest.value).toEqual(imported);
      expect(opts.onSuccess).toHaveBeenCalledWith("xroad.curlImport.success");
      expect(opts.onWarning).toHaveBeenCalledWith("w");
    });

    it("cancelReplace clears the pending import without applying", async () => {
      const opts = makeOpts({ formData: { client: { securityServerUrl: "https://x" } as never } });
      const flow = useCurlImport(opts);

      flow.handleImport({ request: buildRequest(), warnings: [] });
      flow.cancelReplace();

      // After cancel, confirmReplaceAndApply must NOT apply (pending was cleared).
      await flow.confirmReplaceAndApply();
      await Promise.resolve();
      await Promise.resolve();

      expect(opts.currentRequest.value).toBeNull();
      expect(opts.onSuccess).not.toHaveBeenCalled();
    });
  });
});
