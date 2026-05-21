import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeRequest } from '../xroad-proxy.service';
import axios from '@/plugins/axios';
import type { XRoadRequest, XRoadResponse } from '@/types';

vi.mock('@/plugins/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

const createMockRequest = (overrides?: Partial<XRoadRequest>): XRoadRequest => ({
  client: {
    subsystem: {
      instanceId: 'TEST',
      memberClass: 'GOV',
      memberCode: '1234567-8',
      subsystemCode: 'TestClient',
    },
    securityServerUrl: 'https://localhost:8443',
  },
  service: {
    subsystem: {
      instanceId: 'TEST',
      memberClass: 'GOV',
      memberCode: '9876543-2',
      subsystemCode: 'DataService',
    },
    serviceCode: 'getInfo',
  },
  request: {
    method: 'GET',
    path: '/api/test',
  },
  ...overrides,
});

const createMockResponse = (overrides?: Partial<XRoadResponse>): XRoadResponse => ({
  statusCode: 200,
  statusText: 'OK',
  headers: { 'Content-Type': ['application/json'] },
  body: '{"success": true}',
  timestamp: '2026-05-22T12:00:00Z',
  ...overrides,
});

describe('xroad-proxy.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeRequest', () => {
    it('should call the API with the request payload', async () => {
      const request = createMockRequest();
      const response = createMockResponse();
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      await executeRequest(request);

      expect(axios.post).toHaveBeenCalledWith('/api/xroad/execute', request);
    });

    it('should return the response data', async () => {
      const request = createMockRequest();
      const response = createMockResponse();
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      const result = await executeRequest(request);

      expect(result).toEqual(response);
    });

    it('should handle POST requests with body', async () => {
      const request = createMockRequest({
        request: {
          method: 'POST',
          path: '/api/users',
          body: '{"name": "John"}',
          contentType: 'application/json',
        },
      });
      const response = createMockResponse({ statusCode: 201, statusText: 'Created' });
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      const result = await executeRequest(request);

      expect(axios.post).toHaveBeenCalledWith('/api/xroad/execute', request);
      expect(result.statusCode).toBe(201);
    });

    it('should handle requests with custom headers', async () => {
      const request = createMockRequest({
        request: {
          method: 'GET',
          path: '/api/secure',
          headers: {
            Authorization: 'Bearer token123',
            'X-Custom-Header': 'custom-value',
          },
        },
      });
      const response = createMockResponse();
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      await executeRequest(request);

      expect(axios.post).toHaveBeenCalledWith('/api/xroad/execute', request);
    });

    it('should handle requests with query parameters', async () => {
      const request = createMockRequest({
        request: {
          method: 'GET',
          path: '/api/search',
          queryParams: {
            q: 'test query',
            page: '1',
          },
        },
      });
      const response = createMockResponse();
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      await executeRequest(request);

      expect(axios.post).toHaveBeenCalledWith('/api/xroad/execute', request);
    });

    it('should propagate API errors', async () => {
      const request = createMockRequest();
      const error = new Error('Network Error');
      vi.mocked(axios.post).mockRejectedValueOnce(error);

      await expect(executeRequest(request)).rejects.toThrow('Network Error');
    });

    it('should handle X-Road error responses', async () => {
      const request = createMockRequest();
      const response = createMockResponse({
        statusCode: 500,
        statusText: 'Internal Server Error',
        xroadError: {
          type: 'Server.ServerProxy.ServiceFailed',
          message: 'Service failed',
          detail: 'Connection refused',
        },
      });
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      const result = await executeRequest(request);

      expect(result.xroadError).toBeDefined();
      expect(result.xroadError?.type).toBe('Server.ServerProxy.ServiceFailed');
    });

    it('should handle service version in request', async () => {
      const request = createMockRequest({
        service: {
          subsystem: {
            instanceId: 'TEST',
            memberClass: 'GOV',
            memberCode: '9876543-2',
            subsystemCode: 'DataService',
          },
          serviceCode: 'getInfo',
          serviceVersion: 'v1',
        },
      });
      const response = createMockResponse();
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      await executeRequest(request);

      expect(axios.post).toHaveBeenCalledWith('/api/xroad/execute', request);
    });

    it('should handle mTLS certificates in request', async () => {
      const request = createMockRequest();
      request.client.mtlsCertificates = {
        securityServerCert: '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----',
        clientCert: '-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----',
        clientPrivateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----',
      };
      const response = createMockResponse();
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      await executeRequest(request);

      expect(axios.post).toHaveBeenCalledWith('/api/xroad/execute', request);
      const calledRequest = vi.mocked(axios.post).mock.calls[0][1] as XRoadRequest;
      expect(calledRequest.client.mtlsCertificates).toBeDefined();
    });

    it('should return response with X-Road headers', async () => {
      const request = createMockRequest();
      const response = createMockResponse({
        xroadId: 'abc123',
        xroadRequestHash: 'hash456',
        xroadRequestId: 'req789',
      });
      vi.mocked(axios.post).mockResolvedValueOnce({ data: response });

      const result = await executeRequest(request);

      expect(result.xroadId).toBe('abc123');
      expect(result.xroadRequestHash).toBe('hash456');
      expect(result.xroadRequestId).toBe('req789');
    });
  });
});
