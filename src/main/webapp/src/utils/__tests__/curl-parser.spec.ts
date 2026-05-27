import { describe, it, expect } from "vitest";
import { parseCurlCommand } from "../curl-parser";
import { generateCurlCommand } from "../curl-generator";
import type { XRoadRequest } from "@/types";

const createMockRequest = (overrides?: Partial<XRoadRequest>): XRoadRequest => ({
  client: {
    subsystem: {
      instanceId: "TEST",
      memberClass: "GOV",
      memberCode: "1234567-8",
      subsystemCode: "TestClient",
    },
    securityServerUrl: "https://ss.example.com",
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
    path: "/api/data",
  },
  ...overrides,
});

// Strip optional empty fields the generator can't round-trip exactly.
function normalize(req: XRoadRequest): XRoadRequest {
  const cleaned: XRoadRequest = JSON.parse(JSON.stringify(req));
  // mTLS never survives round-trip — placeholder filenames replace the PEM.
  delete cleaned.client.mtlsCertificates;
  return cleaned;
}

describe("curl-parser", () => {
  describe("parseCurlCommand — round-trip with generator", () => {
    it("round-trips a basic GET request", () => {
      const original = createMockRequest();
      const curl = generateCurlCommand(original);
      const { request, warnings, error } = parseCurlCommand(curl);

      expect(error).toBeNull();
      expect(warnings).toEqual([]);
      expect(request).toEqual(normalize(original));
    });

    it("round-trips POST with body and content-type", () => {
      const original = createMockRequest({
        request: {
          method: "POST",
          path: "/api/data",
          body: '{"name": "John"}',
          contentType: "application/json",
        },
      });
      const curl = generateCurlCommand(original);
      const { request, error } = parseCurlCommand(curl);

      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("round-trips PUT", () => {
      const original = createMockRequest({
        request: { method: "PUT", path: "/api/data", body: '{"x": 1}', contentType: "application/json" },
      });
      const { request, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("round-trips DELETE", () => {
      const original = createMockRequest({
        request: { method: "DELETE", path: "/api/data/123" },
      });
      const { request, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("round-trips PATCH", () => {
      const original = createMockRequest({
        request: { method: "PATCH", path: "/api/data", body: '{"f": "v"}', contentType: "application/json" },
      });
      const { request, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("round-trips query parameters", () => {
      const original = createMockRequest({
        request: {
          method: "GET",
          path: "/api/search",
          queryParams: { q: "test", page: "1" },
        },
      });
      const { request, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("round-trips custom headers", () => {
      const original = createMockRequest({
        request: {
          method: "GET",
          path: "/api/data",
          headers: {
            Authorization: "Bearer token123",
            "X-Custom-Header": "custom-value",
          },
        },
      });
      const { request, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("round-trips serviceVersion", () => {
      const original = createMockRequest({
        service: {
          subsystem: {
            instanceId: "TEST",
            memberClass: "GOV",
            memberCode: "9876543-2",
            subsystemCode: "DataService",
          },
          serviceCode: "getInfo",
          serviceVersion: "v1",
        },
      });
      const { request, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("round-trips body containing escaped single quotes", () => {
      const original = createMockRequest({
        request: {
          method: "POST",
          path: "/api/data",
          body: "{'name': 'John's data'}",
          contentType: "application/json",
        },
      });
      const { request, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
    });

    it("emits mTLS warning on round-trip when certificates were present", () => {
      const original = createMockRequest();
      original.client.mtlsCertificates = {
        clientCert: "-----BEGIN CERTIFICATE-----\nMIIC...",
        clientPrivateKey: "-----BEGIN PRIVATE KEY-----\nMIIE...",
      };
      const { request, warnings, error } = parseCurlCommand(generateCurlCommand(original));
      expect(error).toBeNull();
      expect(request).toEqual(normalize(original));
      expect(warnings.some((w) => /mTLS/i.test(w))).toBe(true);
    });
  });

  describe("parseCurlCommand — direct parsing", () => {
    it("infers POST when -d is present without -X", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient' -d 'hello'`;
      const { request, error } = parseCurlCommand(curl);
      expect(error).toBeNull();
      expect(request?.request.method).toBe("POST");
      expect(request?.request.body).toBe("hello");
    });

    it("treats segment after serviceCode as path when it does not match version pattern", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/users/42' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(error).toBeNull();
      expect(request?.service.serviceVersion).toBeUndefined();
      expect(request?.request.path).toBe("/users/42");
    });

    it("treats segment matching version pattern as serviceVersion", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/v2/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(error).toBeNull();
      expect(request?.service.serviceVersion).toBe("v2");
      expect(request?.request.path).toBe("/api/data");
    });

    it("accepts double-quoted args", () => {
      const curl = `curl "https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data" -H "X-Road-Client: TEST/GOV/1234567-8/TestClient"`;
      const { request, error } = parseCurlCommand(curl);
      expect(error).toBeNull();
      expect(request?.client.subsystem.subsystemCode).toBe("TestClient");
    });

    it("handles bash line continuations", () => {
      const curl = `curl \\\n  'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' \\\n  -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(error).toBeNull();
      expect(request).not.toBeNull();
    });

    it("accepts -v (the only no-op flag exported by curl-generator)", () => {
      const curl = `curl -v 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { error } = parseCurlCommand(curl);
      expect(error).toBeNull();
    });

    it("accepts --verbose long form", () => {
      const curl = `curl --verbose 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { error } = parseCurlCommand(curl);
      expect(error).toBeNull();
    });

    it("parses query params from URL", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/search?q=foo&page=2' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(error).toBeNull();
      expect(request?.request.queryParams).toEqual({ q: "foo", page: "2" });
    });
  });

  describe("parseCurlCommand — error cases", () => {
    it("rejects empty input", () => {
      const { request, error } = parseCurlCommand("");
      expect(request).toBeNull();
      expect(error).toMatch(/empty/i);
    });

    it("rejects input that does not start with curl", () => {
      const { request, error } = parseCurlCommand("wget https://example.com");
      expect(request).toBeNull();
      expect(error).toMatch(/curl/i);
    });

    it("rejects when URL is missing", () => {
      const { request, error } = parseCurlCommand("curl -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'");
      expect(request).toBeNull();
      expect(error).toMatch(/url/i);
    });

    it("rejects when URL is not an X-Road endpoint (no /r1/)", () => {
      const curl = `curl 'https://example.com/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/r1/i);
    });

    it("rejects X-Road URL missing required segments", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/CODE' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/incomplete/i);
    });

    it("rejects when X-Road-Client header is missing", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/X-Road-Client/i);
    });

    it("rejects malformed X-Road-Client header", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/X-Road-Client/i);
    });

    it("rejects unterminated quote", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/quote/i);
    });

    it("rejects invalid URL", () => {
      const curl = `curl 'not a url' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/url/i);
    });

    it("rejects unsupported short flag (e.g., -k)", () => {
      const curl = `curl -k 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/-k/);
      expect(error).toMatch(/unsupported/i);
    });

    it("rejects unsupported long flag (e.g., --compressed)", () => {
      const curl = `curl --compressed 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/--compressed/);
    });

    it("rejects arg-taking flag we do not support (-u)", () => {
      const curl = `curl -u admin:secret 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/-u/);
    });

    it("rejects bundled short flags (-sk)", () => {
      const curl = `curl -sk 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { request, error } = parseCurlCommand(curl);
      expect(request).toBeNull();
      expect(error).toMatch(/-sk/);
    });
  });

  describe("parseCurlCommand — errorSpan reporting", () => {
    it("points at the offending flag", () => {
      const curl = `curl -k 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { errorSpan } = parseCurlCommand(curl);
      expect(errorSpan).toBeDefined();
      expect(curl.slice(errorSpan!.start, errorSpan!.end)).toBe("-k");
    });

    it("points at the bad URL", () => {
      const curl = `curl 'https://example.com/api/data' -H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'`;
      const { errorSpan } = parseCurlCommand(curl);
      expect(errorSpan).toBeDefined();
      const sliced = curl.slice(errorSpan!.start, errorSpan!.end);
      expect(sliced).toContain("example.com");
    });

    it("points at the unterminated quote", () => {
      const curl = `curl 'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data`;
      const { errorSpan } = parseCurlCommand(curl);
      expect(errorSpan).toBeDefined();
      expect(curl[errorSpan!.start]).toBe("'");
    });

    it("preserves offsets across bash line continuations", () => {
      const curl = `curl \\\n  -k \\\n  'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data'`;
      const { errorSpan } = parseCurlCommand(curl);
      expect(errorSpan).toBeDefined();
      expect(curl.slice(errorSpan!.start, errorSpan!.end)).toBe("-k");
    });
  });
});
