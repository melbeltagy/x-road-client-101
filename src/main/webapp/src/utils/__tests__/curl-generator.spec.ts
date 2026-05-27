import { describe, it, expect } from "vitest";
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

describe("curl-generator", () => {
  describe("generateCurlCommand", () => {
    it("should generate basic GET curl command", () => {
      const request = createMockRequest();

      const result = generateCurlCommand(request);

      expect(result).toContain("curl");
      expect(result).toContain("-v");
      expect(result).toContain("'https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data'");
      expect(result).toContain("-H 'X-Road-Client: TEST/GOV/1234567-8/TestClient'");
      expect(result).not.toContain("-X GET"); // GET is default, no need for -X
    });

    it("should add -X flag for non-GET methods", () => {
      const request = createMockRequest({
        request: { method: "POST", path: "/api/data" },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("-X POST");
    });

    it("should add -X flag for PUT method", () => {
      const request = createMockRequest({
        request: { method: "PUT", path: "/api/data" },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("-X PUT");
    });

    it("should add -X flag for DELETE method", () => {
      const request = createMockRequest({
        request: { method: "DELETE", path: "/api/data/123" },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("-X DELETE");
    });

    it("should add -X flag for PATCH method", () => {
      const request = createMockRequest({
        request: { method: "PATCH", path: "/api/data" },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("-X PATCH");
    });

    it("should include query parameters in URL", () => {
      const request = createMockRequest({
        request: {
          method: "GET",
          path: "/api/search",
          queryParams: { q: "test", page: "1" },
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("?q=test&page=1");
    });

    it("should include Content-Type header when specified", () => {
      const request = createMockRequest({
        request: {
          method: "POST",
          path: "/api/data",
          contentType: "application/json",
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("-H 'Content-Type: application/json'");
    });

    it("should include custom headers", () => {
      const request = createMockRequest({
        request: {
          method: "GET",
          path: "/api/data",
          headers: {
            Authorization: "Bearer token123",
            "X-Custom-Header": "custom-value",
          },
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("-H 'Authorization: Bearer token123'");
      expect(result).toContain("-H 'X-Custom-Header: custom-value'");
    });

    it("should not duplicate Content-Type in custom headers", () => {
      const request = createMockRequest({
        request: {
          method: "POST",
          path: "/api/data",
          contentType: "application/json",
          headers: {
            "Content-Type": "text/plain", // Should be ignored
            "X-Custom": "value",
          },
        },
      });

      const result = generateCurlCommand(request);

      // Should only have one Content-Type header (from contentType field)
      const contentTypeMatches = result.match(/-H 'Content-Type:/g);
      expect(contentTypeMatches).toHaveLength(1);
      expect(result).toContain("-H 'Content-Type: application/json'");
    });

    it("should include request body for POST", () => {
      const request = createMockRequest({
        request: {
          method: "POST",
          path: "/api/data",
          body: '{"name": "John"}',
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain('-d \'{"name": "John"}\'');
    });

    it("should include request body for PUT", () => {
      const request = createMockRequest({
        request: {
          method: "PUT",
          path: "/api/data",
          body: '{"updated": true}',
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("-d '{\"updated\": true}'");
    });

    it("should include request body for PATCH", () => {
      const request = createMockRequest({
        request: {
          method: "PATCH",
          path: "/api/data",
          body: '{"field": "value"}',
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain('-d \'{"field": "value"}\'');
    });

    it("should not include body for GET requests", () => {
      const request = createMockRequest({
        request: {
          method: "GET",
          path: "/api/data",
          body: "should be ignored",
        },
      });

      const result = generateCurlCommand(request);

      expect(result).not.toContain("-d ");
    });

    it("should escape single quotes in body", () => {
      const request = createMockRequest({
        request: {
          method: "POST",
          path: "/api/data",
          body: "{'name': 'John's data'}",
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain("'\\''"); // Escaped single quote
    });

    it("should include service version in URL", () => {
      const request = createMockRequest({
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

      const result = generateCurlCommand(request);

      expect(result).toContain("/getInfo/v1/api/data");
    });

    it("should add mTLS certificate placeholders when configured", () => {
      const request = createMockRequest();
      request.client.mtlsCertificates = {
        clientCert: "-----BEGIN CERTIFICATE-----\nMIIC...",
        clientPrivateKey: "-----BEGIN PRIVATE KEY-----\nMIIE...",
        securityServerCert: "-----BEGIN CERTIFICATE-----\nMIID...",
      };

      const result = generateCurlCommand(request);

      expect(result).toContain("--cert <client-cert.pem>");
      expect(result).toContain("--key <client-key.pem>");
      expect(result).toContain("--cacert <server-cert.pem>");
    });

    it("should only include available mTLS options", () => {
      const request = createMockRequest();
      request.client.mtlsCertificates = {
        clientCert: "-----BEGIN CERTIFICATE-----\nMIIC...",
      };

      const result = generateCurlCommand(request);

      expect(result).toContain("--cert <client-cert.pem>");
      expect(result).not.toContain("--key");
      expect(result).not.toContain("--cacert");
    });

    it("should format command with line continuations", () => {
      const request = createMockRequest({
        request: {
          method: "POST",
          path: "/api/data",
          contentType: "application/json",
          body: "{}",
        },
      });

      const result = generateCurlCommand(request);

      expect(result).toContain(" \\\n  "); // Line continuation
    });
  });
});
