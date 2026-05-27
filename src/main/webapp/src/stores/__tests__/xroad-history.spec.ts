import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useXRoadHistoryStore } from "../xroad-history";
import type { XRoadRequest, XRoadResponse } from "@/types";

const createMockRequest = (overrides?: Partial<XRoadRequest>): XRoadRequest => ({
  client: {
    subsystem: {
      instanceId: "TEST",
      memberClass: "GOV",
      memberCode: "1234567-8",
      subsystemCode: "TestClient",
    },
    securityServerUrl: "https://localhost:8443",
  },
  service: {
    subsystem: {
      instanceId: "TEST",
      memberClass: "GOV",
      memberCode: "9876543-2",
      subsystemCode: "DataService",
    },
    serviceCode: "getInfo",
  },
  request: {
    method: "GET",
    path: "/api/test",
  },
  ...overrides,
});

const createMockResponse = (overrides?: Partial<XRoadResponse>): XRoadResponse => ({
  statusCode: 200,
  statusText: "OK",
  headers: {},
  body: '{"success": true}',
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe("XRoad History Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("initial state", () => {
    it("should have empty entries", () => {
      const store = useXRoadHistoryStore();
      expect(store.entries).toHaveLength(0);
    });

    it("should have sidebar closed", () => {
      const store = useXRoadHistoryStore();
      expect(store.sidebarOpen).toBe(false);
    });

    it("should have no selected entry", () => {
      const store = useXRoadHistoryStore();
      expect(store.selectedEntryId).toBeNull();
    });
  });

  describe("addRequestToHistory", () => {
    it("should add a request to history", () => {
      const store = useXRoadHistoryStore();
      const request = createMockRequest();
      const response = createMockResponse();

      store.addRequestToHistory(request, response);

      expect(store.entries).toHaveLength(1);
      expect(store.entries[0].request).toEqual(
        expect.objectContaining({
          client: expect.objectContaining({
            subsystem: request.client.subsystem,
          }),
        }),
      );
    });

    it("should select the new entry", () => {
      const store = useXRoadHistoryStore();
      const request = createMockRequest();
      const response = createMockResponse();

      store.addRequestToHistory(request, response);

      expect(store.selectedEntryId).toBe(store.entries[0].id);
    });

    it("should add entries at the beginning", () => {
      const store = useXRoadHistoryStore();
      const request1 = createMockRequest();
      const request2 = createMockRequest({
        service: {
          ...createMockRequest().service,
          serviceCode: "secondService",
        },
      });
      const response = createMockResponse();

      store.addRequestToHistory(request1, response);
      store.addRequestToHistory(request2, response);

      expect(store.entries).toHaveLength(2);
      expect(store.entries[0].request.service.serviceCode).toBe("secondService");
    });

    it("should limit to max history entries (default 15)", () => {
      const store = useXRoadHistoryStore();
      const response = createMockResponse();

      for (let i = 0; i < 20; i++) {
        store.addRequestToHistory(createMockRequest(), response);
      }

      expect(store.entries).toHaveLength(15);
    });

    it("should sanitize mTLS certificates from request", () => {
      const store = useXRoadHistoryStore();
      const request = createMockRequest();
      request.client.mtlsCertificates = {
        securityServerCert: "secret-cert",
        clientCert: "client-cert",
        clientPrivateKey: "private-key",
      };
      const response = createMockResponse();

      store.addRequestToHistory(request, response);

      expect(store.entries[0].request.client.mtlsCertificates).toBeUndefined();
    });
  });

  describe("selectHistoryEntry", () => {
    it("should select an entry by id", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      const entryId = store.entries[0].id;

      store.selectHistoryEntry(entryId);

      expect(store.selectedEntryId).toBe(entryId);
    });

    it("should allow selecting null", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());

      store.selectHistoryEntry(null);

      expect(store.selectedEntryId).toBeNull();
    });
  });

  describe("deleteHistoryEntry", () => {
    it("should delete an entry", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      const entryId = store.entries[0].id;

      store.deleteHistoryEntry(entryId);

      expect(store.entries).toHaveLength(0);
    });

    it("should update selected entry if deleted entry was selected", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      const firstEntryId = store.entries[0].id;

      store.deleteHistoryEntry(firstEntryId);

      expect(store.selectedEntryId).toBe(store.entries[0].id);
    });
  });

  describe("clearHistory", () => {
    it("should clear all entries", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      store.addRequestToHistory(createMockRequest(), createMockResponse());

      store.clearHistory();

      expect(store.entries).toHaveLength(0);
      expect(store.selectedEntryId).toBeNull();
    });
  });

  describe("sidebar controls", () => {
    it("should toggle sidebar", () => {
      const store = useXRoadHistoryStore();

      store.toggleHistorySidebar();
      expect(store.sidebarOpen).toBe(true);

      store.toggleHistorySidebar();
      expect(store.sidebarOpen).toBe(false);
    });

    it("should open sidebar", () => {
      const store = useXRoadHistoryStore();

      store.openHistorySidebar();

      expect(store.sidebarOpen).toBe(true);
    });

    it("should close sidebar", () => {
      const store = useXRoadHistoryStore();
      store.openHistorySidebar();

      store.closeHistorySidebar();

      expect(store.sidebarOpen).toBe(false);
    });
  });

  describe("computed properties", () => {
    it("should return selected entry", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      const entry = store.entries[0];

      expect(store.selectedEntry).toEqual(entry);
    });

    it("should return most recent entry", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      store.addRequestToHistory(createMockRequest(), createMockResponse());

      expect(store.mostRecentEntry).toEqual(store.entries[0]);
    });

    it("should return null for most recent when empty", () => {
      const store = useXRoadHistoryStore();

      expect(store.mostRecentEntry).toBeNull();
    });
  });

  describe("error isolation", () => {
    it("returns true and leaves lastError null on a healthy save", () => {
      const store = useXRoadHistoryStore();

      const ok = store.addRequestToHistory(createMockRequest(), createMockResponse());

      expect(ok).toBe(true);
      expect(store.lastError).toBeNull();
      expect(store.entries).toHaveLength(1);
    });

    it("returns false and records lastError when sanitization throws", () => {
      const store = useXRoadHistoryStore();
      const badRequest = new Proxy({} as XRoadRequest, {
        get() {
          throw new Error("boom");
        },
      });

      const ok = store.addRequestToHistory(badRequest, createMockResponse());

      expect(ok).toBe(false);
      expect(store.lastError).toMatchObject({ op: "save", message: "boom" });
      expect(store.entries).toHaveLength(0);
    });

    it("does not throw out of addRequestToHistory even on internal failure", () => {
      const store = useXRoadHistoryStore();
      const badRequest = new Proxy({} as XRoadRequest, {
        get() {
          throw new Error("boom");
        },
      });

      // The core promise of the isolation: failures must not bubble
      // out of the store into the request flow.
      expect(() => store.addRequestToHistory(badRequest, createMockResponse())).not.toThrow();
    });

    it("clearError resets lastError", () => {
      const store = useXRoadHistoryStore();
      const badRequest = new Proxy({} as XRoadRequest, {
        get() {
          throw new Error("boom");
        },
      });
      store.addRequestToHistory(badRequest, createMockResponse());
      expect(store.lastError).not.toBeNull();

      store.clearError();
      expect(store.lastError).toBeNull();
    });

    it("deleteHistoryEntry returns true on success", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());
      const id = store.entries[0].id;

      const ok = store.deleteHistoryEntry(id);

      expect(ok).toBe(true);
      expect(store.lastError).toBeNull();
    });

    it("clearHistory returns true on success", () => {
      const store = useXRoadHistoryStore();
      store.addRequestToHistory(createMockRequest(), createMockResponse());

      const ok = store.clearHistory();

      expect(ok).toBe(true);
      expect(store.lastError).toBeNull();
    });
  });
});
