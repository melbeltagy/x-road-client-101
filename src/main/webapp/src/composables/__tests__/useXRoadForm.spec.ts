import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useXRoadForm } from '../useXRoadForm';
import type { XRoadRequest } from '@/types';

describe('useXRoadForm', () => {
  let form: ReturnType<typeof useXRoadForm>;

  beforeEach(() => {
    vi.clearAllMocks();
    form = useXRoadForm();
  });

  describe('initial state', () => {
    it('should start with empty client subsystem', () => {
      expect(form.formData.client.subsystem).toEqual({
        instanceId: '',
        memberClass: '',
        memberCode: '',
        subsystemCode: '',
      });
    });

    it('should start with empty security server URL', () => {
      expect(form.formData.client.securityServerUrl).toBe('');
    });

    it('should start with empty service subsystem', () => {
      expect(form.formData.service.subsystem).toEqual({
        instanceId: '',
        memberClass: '',
        memberCode: '',
        subsystemCode: '',
      });
    });

    it('should start with GET method', () => {
      expect(form.formData.request.method).toBe('GET');
    });

    it('should start with empty certificates', () => {
      expect(form.certificates.value).toEqual({});
    });

    it('should start with empty query params', () => {
      expect(form.queryParams.value).toEqual([]);
    });

    it('should start with empty custom headers', () => {
      expect(form.customHeaders.value).toEqual([]);
    });

    it('should start on identifiers tab', () => {
      expect(form.activeTab.value).toBe('identifiers');
    });

    it('should start with all identifier panels collapsed', () => {
      // Fresh form matches the "Security Server is Next" state shown
      // by the progress chips: SS URL field is visible above the
      // accordions; the accordions stay closed until the user clicks
      // the chip for that section (or expands the accordion header).
      expect(form.openIdentifierPanels.value).toEqual([]);
    });
  });

  describe('buildRequest', () => {
    it('should build basic request without certificates', () => {
      form.formData.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234',
        subsystemCode: 'Client',
      };
      form.formData.client.securityServerUrl = 'https://ss.example.com';
      form.formData.service.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '5678',
        subsystemCode: 'Service',
      };
      form.formData.service.serviceCode = 'getInfo';
      form.formData.request.method = 'GET';
      form.formData.request.path = '/api/data';

      const request = form.buildRequest();

      expect(request.client.subsystem.instanceId).toBe('TEST');
      expect(request.client.securityServerUrl).toBe('https://ss.example.com');
      expect(request.service.serviceCode).toBe('getInfo');
      expect(request.request.method).toBe('GET');
      expect(request.request.path).toBe('/api/data');
      expect(request.client.mtlsCertificates).toBeUndefined();
    });

    it('should include mTLS certificates when provided', () => {
      form.formData.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234',
        subsystemCode: 'Client',
      };
      form.formData.client.securityServerUrl = 'https://ss.example.com';
      form.formData.service.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '5678',
        subsystemCode: 'Service',
      };
      form.formData.service.serviceCode = 'getInfo';
      form.formData.request.path = '/api';
      form.certificates.value = {
        clientCert: '-----BEGIN CERTIFICATE-----',
        clientPrivateKey: '-----BEGIN PRIVATE KEY-----',
        securityServerCert: '-----BEGIN CERTIFICATE-----',
      };

      const request = form.buildRequest();

      expect(request.client.mtlsCertificates).toBeDefined();
      expect(request.client.mtlsCertificates?.clientCert).toBe('-----BEGIN CERTIFICATE-----');
    });

    it('should include query params', () => {
      form.formData.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234',
        subsystemCode: 'Client',
      };
      form.formData.client.securityServerUrl = 'https://ss.example.com';
      form.formData.service.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '5678',
        subsystemCode: 'Service',
      };
      form.formData.service.serviceCode = 'search';
      form.formData.request.path = '/api';
      form.queryParams.value = [
        { id: '1', key: 'q', value: 'test' },
        { id: '2', key: 'page', value: '1' },
      ];

      const request = form.buildRequest();

      expect(request.request.queryParams).toEqual({ q: 'test', page: '1' });
    });

    it('should include custom headers', () => {
      form.formData.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234',
        subsystemCode: 'Client',
      };
      form.formData.client.securityServerUrl = 'https://ss.example.com';
      form.formData.service.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '5678',
        subsystemCode: 'Service',
      };
      form.formData.service.serviceCode = 'getInfo';
      form.formData.request.path = '/api';
      form.customHeaders.value = [
        { id: '1', key: 'Authorization', value: 'Bearer token' },
      ];

      const request = form.buildRequest();

      expect(request.request.headers).toEqual({ Authorization: 'Bearer token' });
    });

    it('should include service version when provided', () => {
      form.formData.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234',
        subsystemCode: 'Client',
      };
      form.formData.client.securityServerUrl = 'https://ss.example.com';
      form.formData.service.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '5678',
        subsystemCode: 'Service',
      };
      form.formData.service.serviceCode = 'getInfo';
      form.formData.service.serviceVersion = 'v1';
      form.formData.request.path = '/api';

      const request = form.buildRequest();

      expect(request.service.serviceVersion).toBe('v1');
    });
  });

  describe('populateFromRequest', () => {
    it('should populate form from request', () => {
      const request: XRoadRequest = {
        client: {
          subsystem: {
            instanceId: 'PROD',
            memberClass: 'COM',
            memberCode: '9999',
            subsystemCode: 'App',
          },
          securityServerUrl: 'https://prod.example.com',
        },
        service: {
          subsystem: {
            instanceId: 'PROD',
            memberClass: 'COM',
            memberCode: '8888',
            subsystemCode: 'API',
          },
          serviceCode: 'fetchData',
          serviceVersion: 'v2',
        },
        request: {
          method: 'POST',
          path: '/users',
          body: '{"name": "Test"}',
          contentType: 'application/json',
        },
      };

      form.populateFromRequest(request);

      expect(form.formData.client.subsystem.instanceId).toBe('PROD');
      expect(form.formData.client.securityServerUrl).toBe('https://prod.example.com');
      expect(form.formData.service.serviceCode).toBe('fetchData');
      expect(form.formData.service.serviceVersion).toBe('v2');
      expect(form.formData.request.method).toBe('POST');
      expect(form.formData.request.body).toBe('{"name": "Test"}');
    });

    it('should populate query params from request', () => {
      const request: XRoadRequest = {
        client: {
          subsystem: { instanceId: 'T', memberClass: 'G', memberCode: '1', subsystemCode: 'C' },
          securityServerUrl: 'https://ss.example.com',
        },
        service: {
          subsystem: { instanceId: 'T', memberClass: 'G', memberCode: '2', subsystemCode: 'S' },
          serviceCode: 'search',
        },
        request: {
          method: 'GET',
          path: '/api',
          queryParams: { q: 'test', limit: '10' },
        },
      };

      form.populateFromRequest(request);

      expect(form.queryParams.value.length).toBe(2);
      expect(form.queryParams.value.some((p) => p.key === 'q' && p.value === 'test')).toBe(true);
      expect(form.queryParams.value.some((p) => p.key === 'limit' && p.value === '10')).toBe(true);
    });

    it('should populate custom headers from request', () => {
      const request: XRoadRequest = {
        client: {
          subsystem: { instanceId: 'T', memberClass: 'G', memberCode: '1', subsystemCode: 'C' },
          securityServerUrl: 'https://ss.example.com',
        },
        service: {
          subsystem: { instanceId: 'T', memberClass: 'G', memberCode: '2', subsystemCode: 'S' },
          serviceCode: 'api',
        },
        request: {
          method: 'GET',
          path: '/api',
          headers: { 'X-Custom': 'value' },
        },
      };

      form.populateFromRequest(request);

      expect(form.customHeaders.value.length).toBe(1);
      expect(form.customHeaders.value[0].key).toBe('X-Custom');
      expect(form.customHeaders.value[0].value).toBe('value');
    });

    it('should NOT populate certificates for security', () => {
      form.certificates.value = {
        clientCert: 'old-cert',
      };

      const request: XRoadRequest = {
        client: {
          subsystem: { instanceId: 'T', memberClass: 'G', memberCode: '1', subsystemCode: 'C' },
          securityServerUrl: 'https://ss.example.com',
          mtlsCertificates: {
            clientCert: 'new-cert',
            clientPrivateKey: 'key',
          },
        },
        service: {
          subsystem: { instanceId: 'T', memberClass: 'G', memberCode: '2', subsystemCode: 'S' },
          serviceCode: 'api',
        },
        request: {
          method: 'GET',
          path: '/api',
        },
      };

      form.populateFromRequest(request);

      // Certificates should be cleared, not populated from history
      expect(form.certificates.value).toEqual({});
    });
  });

  describe('clear handlers', () => {
    it('should clear client subsystem', () => {
      form.formData.client.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '1234',
        subsystemCode: 'Client',
      };

      form.clearClient();

      expect(form.formData.client.subsystem).toEqual({
        instanceId: '',
        memberClass: '',
        memberCode: '',
        subsystemCode: '',
      });
    });

    it('should clear security server URL', () => {
      form.formData.client.securityServerUrl = 'https://ss.example.com';

      form.clearSecurityServerUrl();

      expect(form.formData.client.securityServerUrl).toBe('');
    });

    it('should clear service section', () => {
      form.formData.service.subsystem = {
        instanceId: 'TEST',
        memberClass: 'GOV',
        memberCode: '5678',
        subsystemCode: 'Service',
      };
      form.formData.service.serviceCode = 'getInfo';
      form.formData.service.serviceVersion = 'v1';

      form.clearService();

      expect(form.formData.service.subsystem).toEqual({
        instanceId: '',
        memberClass: '',
        memberCode: '',
        subsystemCode: '',
      });
      expect(form.formData.service.serviceCode).toBe('');
      expect(form.formData.service.serviceVersion).toBe('');
    });

    it('should clear request section', () => {
      form.formData.request.method = 'POST';
      form.formData.request.path = '/api/users';
      form.formData.request.body = '{"name": "Test"}';
      form.formData.request.contentType = 'application/json';
      form.queryParams.value = [{ id: '1', key: 'q', value: 'test' }];
      form.customHeaders.value = [{ id: '1', key: 'Auth', value: 'token' }];

      form.clearRequest();

      expect(form.formData.request.method).toBe('GET');
      expect(form.formData.request.path).toBe('');
      expect(form.formData.request.body).toBe('');
      expect(form.formData.request.contentType).toBe('');
      expect(form.queryParams.value).toEqual([]);
      expect(form.customHeaders.value).toEqual([]);
    });
  });

  describe('query params handlers', () => {
    it('should add query param', () => {
      form.addQueryParam();

      expect(form.queryParams.value.length).toBe(1);
      expect(form.queryParams.value[0].key).toBe('');
      expect(form.queryParams.value[0].value).toBe('');
      expect(form.queryParams.value[0].id).toContain('qp-');
    });

    it('should remove query param', () => {
      form.queryParams.value = [
        { id: '1', key: 'a', value: '1' },
        { id: '2', key: 'b', value: '2' },
        { id: '3', key: 'c', value: '3' },
      ];

      form.removeQueryParam(1);

      expect(form.queryParams.value.length).toBe(2);
      expect(form.queryParams.value.map((p) => p.key)).toEqual(['a', 'c']);
    });

    it('should update query param key', () => {
      form.queryParams.value = [{ id: '1', key: '', value: '' }];

      form.updateQueryParam(0, 'key', 'search');

      expect(form.queryParams.value[0].key).toBe('search');
    });

    it('should update query param value', () => {
      form.queryParams.value = [{ id: '1', key: 'q', value: '' }];

      form.updateQueryParam(0, 'value', 'test');

      expect(form.queryParams.value[0].value).toBe('test');
    });

    it('should clear all query params', () => {
      form.queryParams.value = [
        { id: '1', key: 'a', value: '1' },
        { id: '2', key: 'b', value: '2' },
      ];

      form.clearQueryParams();

      expect(form.queryParams.value).toEqual([]);
    });
  });

  describe('custom header handlers', () => {
    it('should add custom header', () => {
      form.addCustomHeader();

      expect(form.customHeaders.value.length).toBe(1);
      expect(form.customHeaders.value[0].key).toBe('');
      expect(form.customHeaders.value[0].value).toBe('');
      expect(form.customHeaders.value[0].id).toContain('ch-');
    });

    it('should remove custom header', () => {
      form.customHeaders.value = [
        { id: '1', key: 'X-A', value: '1' },
        { id: '2', key: 'X-B', value: '2' },
      ];

      form.removeCustomHeader(0);

      expect(form.customHeaders.value.length).toBe(1);
      expect(form.customHeaders.value[0].key).toBe('X-B');
    });

    it('should update custom header', () => {
      form.customHeaders.value = [{ id: '1', key: '', value: '' }];

      form.updateCustomHeader(0, 'key', 'Authorization');
      form.updateCustomHeader(0, 'value', 'Bearer token');

      expect(form.customHeaders.value[0].key).toBe('Authorization');
      expect(form.customHeaders.value[0].value).toBe('Bearer token');
    });

    it('should clear all custom headers', () => {
      form.customHeaders.value = [
        { id: '1', key: 'X-A', value: '1' },
        { id: '2', key: 'X-B', value: '2' },
      ];

      form.clearCustomHeaders();

      expect(form.customHeaders.value).toEqual([]);
    });
  });

  describe('available services', () => {
    it('should set available services', () => {
      const services = [
        { serviceCode: 'api1', serviceType: 'REST', endpoints: [{ method: 'GET', path: '/data' }] },
        { serviceCode: 'api2', serviceType: 'REST', endpoints: [] },
      ];

      form.setAvailableServices(services);

      expect(form.availableServices.value).toEqual(services);
    });

    it('should compute endpoints for selected service', () => {
      form.availableServices.value = [
        { serviceCode: 'api1', serviceType: 'REST', endpoints: [{ method: 'GET', path: '/data' }] },
        { serviceCode: 'api2', serviceType: 'REST', endpoints: [{ method: 'POST', path: '/submit' }] },
      ];
      form.formData.service.serviceCode = 'api2';

      expect(form.selectedServiceEndpoints.value).toEqual([{ method: 'POST', path: '/submit' }]);
    });

    it('should return empty endpoints when no service selected', () => {
      form.availableServices.value = [
        { serviceCode: 'api1', serviceType: 'REST', endpoints: [{ method: 'GET', path: '/data' }] },
      ];
      form.formData.service.serviceCode = '';

      expect(form.selectedServiceEndpoints.value).toEqual([]);
    });

    it('should return empty endpoints when service not found', () => {
      form.availableServices.value = [
        { serviceCode: 'api1', serviceType: 'REST', endpoints: [{ method: 'GET', path: '/data' }] },
      ];
      form.formData.service.serviceCode = 'nonexistent';

      expect(form.selectedServiceEndpoints.value).toEqual([]);
    });
  });
});
