import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/services/xroad-proxy.service", () => ({
  default: {
    executeRequest: vi.fn(),
  },
}));

import { useRequestExecutor } from "../useRequestExecutor";
import xroadProxyService from "@/services/xroad-proxy.service";
import { useXRoadHistoryStore } from "@/stores/xroad-history";
import type { XRoadRequest, XRoadResponse } from "@/types";

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

function makeCallbacks() {
  return { onAlert: vi.fn(), onHistoryWarning: vi.fn() };
}

describe("useRequestExecutor", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("not loading, no response, lastRequestSuccess=null", () => {
      const { loading, response, lastRequestSuccess } = useRequestExecutor(makeCallbacks());
      expect(loading.value).toBe(false);
      expect(response.value).toBeNull();
      expect(lastRequestSuccess.value).toBeNull();
    });
  });

  describe("submit - happy 2xx path", () => {
    it("stores response, classifies as success, saves to history, fires success alert", async () => {
      const xroadResponse: XRoadResponse = {
        statusCode: 200,
        statusText: "OK",
        headers: {},
        body: '{"ok":true}',
        timestamp: "ts",
      };
      vi.mocked(xroadProxyService.executeRequest).mockResolvedValue(xroadResponse);

      const cb = makeCallbacks();
      const { submit, response, lastRequestSuccess, loading } = useRequestExecutor(cb);

      const req = buildRequest();
      await submit(req);

      expect(loading.value).toBe(false);
      expect(response.value).toEqual(xroadResponse);
      expect(lastRequestSuccess.value).toBe(true);
      expect(cb.onAlert).toHaveBeenCalledWith("success", expect.stringContaining("200"));
      // History was written.
      const store = useXRoadHistoryStore();
      expect(store.entries).toHaveLength(1);
    });
  });

  describe("submit - 4xx with xroadError", () => {
    it("classifies as failure and fires xroadError alert", async () => {
      const xroadResponse: XRoadResponse = {
        statusCode: 400,
        statusText: "Bad Request",
        headers: {},
        body: "bad",
        timestamp: "ts",
        xroadError: { type: "Server.X", message: "borked" },
      };
      vi.mocked(xroadProxyService.executeRequest).mockResolvedValue(xroadResponse);

      const cb = makeCallbacks();
      const { submit, lastRequestSuccess } = useRequestExecutor(cb);
      await submit(buildRequest());

      expect(lastRequestSuccess.value).toBe(false);
      expect(cb.onAlert).toHaveBeenCalledWith("error", expect.stringContaining("borked"));
    });
  });

  describe("submit - non-2xx non-xroadError (3xx/4xx/5xx generic)", () => {
    it("classifies as failure and fires warning alert with status + statusText", async () => {
      const xroadResponse: XRoadResponse = {
        statusCode: 503,
        statusText: "Service Unavailable",
        headers: {},
        body: "down",
        timestamp: "ts",
      };
      vi.mocked(xroadProxyService.executeRequest).mockResolvedValue(xroadResponse);

      const cb = makeCallbacks();
      const { submit } = useRequestExecutor(cb);
      await submit(buildRequest());

      expect(cb.onAlert).toHaveBeenCalledWith("warning", expect.stringContaining("503"));
    });
  });

  describe("submit - axios rejection with response.data (object error)", () => {
    it("synthesizes a response, fires error alert with picked message", async () => {
      vi.mocked(xroadProxyService.executeRequest).mockRejectedValue({
        response: {
          status: 500,
          statusText: "Internal Server Error",
          data: { type: "Server.Boom", message: "something exploded" },
        },
      });
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const cb = makeCallbacks();
      const { submit, response, lastRequestSuccess } = useRequestExecutor(cb);
      await submit(buildRequest());

      expect(response.value?.statusCode).toBe(500);
      expect(response.value?.body).toContain("something exploded");
      expect(lastRequestSuccess.value).toBe(false);
      expect(cb.onAlert).toHaveBeenCalledWith("error", expect.stringContaining("something exploded"));

      consoleSpy.mockRestore();
    });

    it("prefers body field over message field in error payload", async () => {
      vi.mocked(xroadProxyService.executeRequest).mockRejectedValue({
        response: {
          status: 502,
          statusText: "Bad Gateway",
          data: { body: "body wins", message: "message loses" },
        },
      });
      vi.spyOn(console, "error").mockImplementation(() => {});

      const cb = makeCallbacks();
      const { submit } = useRequestExecutor(cb);
      await submit(buildRequest());

      expect(cb.onAlert).toHaveBeenCalledWith("error", expect.stringContaining("body wins"));
    });
  });

  describe("submit - network error (no response)", () => {
    it("synthesizes a status=0 response with the error message in the body", async () => {
      vi.mocked(xroadProxyService.executeRequest).mockRejectedValue({
        message: "Network Error",
      });
      vi.spyOn(console, "error").mockImplementation(() => {});

      const cb = makeCallbacks();
      const { submit, response } = useRequestExecutor(cb);
      await submit(buildRequest());

      expect(response.value?.statusCode).toBe(0);
      expect(response.value?.body).toBe("Network Error");
      expect(cb.onAlert).toHaveBeenCalledWith("error", expect.stringContaining("Network Error"));
    });
  });

  describe("lastRequestSuccess", () => {
    it.each([
      [200, true],
      [201, true],
      [299, true],
      [300, false],
      [400, false],
      [500, false],
      [0, false],
    ])("statusCode %i → lastRequestSuccess=%s", async (statusCode, expected) => {
      vi.mocked(xroadProxyService.executeRequest).mockResolvedValue({
        statusCode,
        statusText: "",
        headers: {},
        body: "",
        timestamp: "ts",
      });
      const { submit, lastRequestSuccess } = useRequestExecutor(makeCallbacks());
      await submit(buildRequest());
      expect(lastRequestSuccess.value).toBe(expected);
    });
  });

  describe("history-warning escalation", () => {
    it("fires onHistoryWarning when history save fails", async () => {
      const xroadResponse: XRoadResponse = {
        statusCode: 200,
        statusText: "OK",
        headers: {},
        body: "ok",
        timestamp: "ts",
      };
      vi.mocked(xroadProxyService.executeRequest).mockResolvedValue(xroadResponse);

      const cb = makeCallbacks();
      const store = useXRoadHistoryStore();
      // Make addRequestToHistory return false to simulate persistence failure.
      vi.spyOn(store, "addRequestToHistory").mockReturnValue(false);

      const { submit } = useRequestExecutor(cb);
      await submit(buildRequest());

      expect(cb.onHistoryWarning).toHaveBeenCalled();
    });
  });
});
