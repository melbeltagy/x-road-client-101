import { describe, it, expect, beforeEach } from 'vitest';
import { useXRoadValidation } from '../useXRoadValidation';
import type { XRoadFormData } from '../useXRoadValidation';

// Mock vue-i18n
import { vi } from 'vitest';
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const createValidFormData = (): XRoadFormData => ({
  client: {
    subsystem: {
      instanceId: 'TEST',
      memberClass: 'GOV',
      memberCode: '1234567-8',
      subsystemCode: 'TestClient',
    },
    securityServerUrl: 'https://ss.example.com',
  },
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
  request: {
    method: 'GET',
    path: '/api/data',
    body: '',
    contentType: '',
  },
});

describe('useXRoadValidation', () => {
  let validation: ReturnType<typeof useXRoadValidation>;

  beforeEach(() => {
    validation = useXRoadValidation();
  });

  describe('validateForm', () => {
    it('should return true for valid form data', () => {
      const formData = createValidFormData();
      const result = validation.validateForm(formData);
      expect(result).toBe(true);
      expect(validation.errors.value).toEqual({});
    });

    it('should be valid when isValid computed is checked', () => {
      const formData = createValidFormData();
      validation.validateForm(formData);
      expect(validation.isValid.value).toBe(true);
    });
  });

  describe('client subsystem validation', () => {
    it('should require instanceId', () => {
      const formData = createValidFormData();
      formData.client.subsystem.instanceId = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.subsystem.instanceId']).toBe('xroad.validation.required');
    });

    it('should validate instanceId format', () => {
      const formData = createValidFormData();
      formData.client.subsystem.instanceId = 'A'; // Too short

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.subsystem.instanceId']).toBe('xroad.validation.instanceId');
    });

    it('should accept valid instanceId with numbers and hyphens', () => {
      const formData = createValidFormData();
      formData.client.subsystem.instanceId = 'FI-TEST-123';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });

    it('should require memberClass', () => {
      const formData = createValidFormData();
      formData.client.subsystem.memberClass = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.subsystem.memberClass']).toBe('xroad.validation.required');
    });

    it('should validate memberClass format', () => {
      const formData = createValidFormData();
      formData.client.subsystem.memberClass = 'GOV_ORG'; // Contains underscore

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.subsystem.memberClass']).toBe('xroad.validation.memberClass');
    });

    it('should require memberCode', () => {
      const formData = createValidFormData();
      formData.client.subsystem.memberCode = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.subsystem.memberCode']).toBe('xroad.validation.required');
    });

    it('should require subsystemCode', () => {
      const formData = createValidFormData();
      formData.client.subsystem.subsystemCode = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.subsystem.subsystemCode']).toBe('xroad.validation.required');
    });
  });

  describe('security server URL validation', () => {
    it('should require securityServerUrl', () => {
      const formData = createValidFormData();
      formData.client.securityServerUrl = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.securityServerUrl']).toBe('xroad.validation.required');
    });

    it('should validate URL format', () => {
      const formData = createValidFormData();
      formData.client.securityServerUrl = 'not-a-url';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.securityServerUrl']).toBe('xroad.validation.securityServerUrl');
    });

    it('should reject non-HTTP/HTTPS protocols', () => {
      const formData = createValidFormData();
      formData.client.securityServerUrl = 'ftp://ss.example.com';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.securityServerUrl']).toBe('xroad.validation.securityServerUrlProtocol');
    });

    it('should reject URLs with underscores in hostname', () => {
      const formData = createValidFormData();
      formData.client.securityServerUrl = 'https://security_server.example.com';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['client.securityServerUrl']).toBe('xroad.validation.securityServerUrlUnderscore');
    });

    it('should accept HTTPS URL', () => {
      const formData = createValidFormData();
      formData.client.securityServerUrl = 'https://ss.example.com';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });

    it('should accept HTTP URL', () => {
      const formData = createValidFormData();
      formData.client.securityServerUrl = 'http://ss.example.com';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });
  });

  describe('service subsystem validation', () => {
    it('should require service instanceId', () => {
      const formData = createValidFormData();
      formData.service.subsystem.instanceId = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['service.subsystem.instanceId']).toBe('xroad.validation.required');
    });

    it('should require service memberClass', () => {
      const formData = createValidFormData();
      formData.service.subsystem.memberClass = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['service.subsystem.memberClass']).toBe('xroad.validation.required');
    });

    it('should require service memberCode', () => {
      const formData = createValidFormData();
      formData.service.subsystem.memberCode = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['service.subsystem.memberCode']).toBe('xroad.validation.required');
    });

    it('should require service subsystemCode', () => {
      const formData = createValidFormData();
      formData.service.subsystem.subsystemCode = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['service.subsystem.subsystemCode']).toBe('xroad.validation.required');
    });
  });

  describe('service code validation', () => {
    it('should require serviceCode', () => {
      const formData = createValidFormData();
      formData.service.serviceCode = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['service.serviceCode']).toBe('xroad.validation.required');
    });

    it('should validate serviceCode format', () => {
      const formData = createValidFormData();
      formData.service.serviceCode = 'service code'; // Contains space

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['service.serviceCode']).toBe('xroad.validation.serviceCode');
    });

    it('should accept serviceCode with underscore', () => {
      const formData = createValidFormData();
      formData.service.serviceCode = 'get_user_info';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });
  });

  describe('service version validation', () => {
    it('should allow empty service version', () => {
      const formData = createValidFormData();
      formData.service.serviceVersion = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });

    it('should validate service version format', () => {
      const formData = createValidFormData();
      formData.service.serviceVersion = 'version1'; // Invalid format

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['service.serviceVersion']).toBe('xroad.validation.serviceVersion');
    });

    it('should accept v-prefixed version', () => {
      const formData = createValidFormData();
      formData.service.serviceVersion = 'v1';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });

    it('should accept numeric version', () => {
      const formData = createValidFormData();
      formData.service.serviceVersion = '1.0.0';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });

    it('should accept version with v prefix and dots', () => {
      const formData = createValidFormData();
      formData.service.serviceVersion = 'v2.1';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });
  });

  describe('request validation', () => {
    it('should require method', () => {
      const formData = createValidFormData();
      // Empty method is an invalid runtime state we still need to defend
      // against (e.g. a malformed history entry). Cast bypasses the
      // narrowed type at the boundary.
      (formData.request as { method: string }).method = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['request.method']).toBe('xroad.validation.method');
    });

    it('should require path', () => {
      const formData = createValidFormData();
      formData.request.path = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['request.path']).toBe('xroad.validation.required');
    });

    it('should validate path format', () => {
      const formData = createValidFormData();
      formData.request.path = 'api/data'; // Missing leading slash

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(validation.errors.value['request.path']).toBe('xroad.validation.path');
    });

    it('should accept valid path', () => {
      const formData = createValidFormData();
      formData.request.path = '/api/v1/users';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });

    it('should accept path with hyphens and underscores', () => {
      const formData = createValidFormData();
      formData.request.path = '/api/user-data/get_all';

      const result = validation.validateForm(formData);
      expect(result).toBe(true);
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      const formData = createValidFormData();
      formData.client.subsystem.instanceId = '';
      formData.service.serviceCode = '';

      validation.validateForm(formData);
      expect(Object.keys(validation.errors.value).length).toBeGreaterThan(0);

      validation.clearErrors();
      expect(validation.errors.value).toEqual({});
      expect(validation.isValid.value).toBe(true);
    });
  });

  describe('multiple errors', () => {
    it('should collect all validation errors', () => {
      const formData = createValidFormData();
      formData.client.subsystem.instanceId = '';
      formData.client.subsystem.memberClass = '';
      formData.service.serviceCode = '';
      formData.request.path = '';

      const result = validation.validateForm(formData);
      expect(result).toBe(false);
      expect(Object.keys(validation.errors.value).length).toBe(4);
    });
  });
});
