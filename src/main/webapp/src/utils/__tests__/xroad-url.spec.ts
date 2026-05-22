import { describe, it, expect } from 'vitest';
import {
  formatXRoadClient,
  buildServicePath,
  buildServiceUrl,
  buildServiceUrlFromParts,
} from '../xroad-url';
import type { SubsystemId, ServiceId } from '@/types';

const createSubsystem = (overrides?: Partial<SubsystemId>): SubsystemId => ({
  instanceId: 'TEST',
  memberClass: 'GOV',
  memberCode: '1234567-8',
  subsystemCode: 'TestClient',
  ...overrides,
});

const createServiceId = (overrides?: Partial<ServiceId>): ServiceId => ({
  subsystem: createSubsystem({
    memberCode: '9876543-2',
    subsystemCode: 'DataService',
  }),
  serviceCode: 'getInfo',
  ...overrides,
});

describe('xroad-url utilities', () => {
  describe('formatXRoadClient', () => {
    it('should format subsystem as X-Road-Client header value', () => {
      const subsystem = createSubsystem();

      const result = formatXRoadClient(subsystem);

      expect(result).toBe('TEST/GOV/1234567-8/TestClient');
    });

    it('should handle different instance IDs', () => {
      const subsystem = createSubsystem({ instanceId: 'PROD' });

      const result = formatXRoadClient(subsystem);

      expect(result).toBe('PROD/GOV/1234567-8/TestClient');
    });

    it('should handle different member classes', () => {
      const subsystem = createSubsystem({ memberClass: 'COM' });

      const result = formatXRoadClient(subsystem);

      expect(result).toBe('TEST/COM/1234567-8/TestClient');
    });
  });

  describe('buildServicePath', () => {
    it('should build service path without version', () => {
      const service = createServiceId();

      const result = buildServicePath(service, '/api/data');

      expect(result).toBe('/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should build service path with version', () => {
      const service = createServiceId({ serviceVersion: 'v1' });

      const result = buildServicePath(service, '/api/data');

      expect(result).toBe('/r1/TEST/GOV/9876543-2/DataService/getInfo/v1/api/data');
    });

    it('should normalize path without leading slash', () => {
      const service = createServiceId();

      const result = buildServicePath(service, 'api/data');

      expect(result).toBe('/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should handle empty path', () => {
      const service = createServiceId();

      const result = buildServicePath(service, '');

      expect(result).toBe('/r1/TEST/GOV/9876543-2/DataService/getInfo/');
    });

    it('should handle root path', () => {
      const service = createServiceId();

      const result = buildServicePath(service, '/');

      expect(result).toBe('/r1/TEST/GOV/9876543-2/DataService/getInfo/');
    });

    it('should handle complex paths with parameters', () => {
      const service = createServiceId();

      const result = buildServicePath(service, '/users/123/profile');

      expect(result).toBe('/r1/TEST/GOV/9876543-2/DataService/getInfo/users/123/profile');
    });
  });

  describe('buildServiceUrl', () => {
    it('should build full URL with service path', () => {
      const service = createServiceId();

      const result = buildServiceUrl('https://ss.example.com', service, '/api/data');

      expect(result).toBe('https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should remove trailing slash from base URL', () => {
      const service = createServiceId();

      const result = buildServiceUrl('https://ss.example.com/', service, '/api/data');

      expect(result).toBe('https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should remove multiple trailing slashes from base URL', () => {
      const service = createServiceId();

      const result = buildServiceUrl('https://ss.example.com///', service, '/api/data');

      expect(result).toBe('https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should handle URL with port', () => {
      const service = createServiceId();

      const result = buildServiceUrl('https://localhost:8443', service, '/api/data');

      expect(result).toBe('https://localhost:8443/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should handle HTTP URL', () => {
      const service = createServiceId();

      const result = buildServiceUrl('http://ss.local:8080', service, '/api/data');

      expect(result).toBe('http://ss.local:8080/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should include service version in URL', () => {
      const service = createServiceId({ serviceVersion: 'v2' });

      const result = buildServiceUrl('https://ss.example.com', service, '/users');

      expect(result).toBe('https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/v2/users');
    });
  });

  describe('buildServiceUrlFromParts', () => {
    it('should build URL from individual parts without version', () => {
      const result = buildServiceUrlFromParts(
        'https://ss.example.com',
        'TEST',
        'GOV',
        '9876543-2',
        'DataService',
        'getInfo',
        undefined,
        '/api/data'
      );

      expect(result).toBe('https://ss.example.com/r1/TEST/GOV/9876543-2/DataService/getInfo/api/data');
    });

    it('should build URL from individual parts with version', () => {
      const result = buildServiceUrlFromParts(
        'https://ss.example.com',
        'PROD',
        'COM',
        '1111111-1',
        'MyService',
        'listItems',
        'v3',
        '/items'
      );

      expect(result).toBe('https://ss.example.com/r1/PROD/COM/1111111-1/MyService/listItems/v3/items');
    });
  });
});
