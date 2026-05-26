import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useFormCompleteness, type FormCompletenessInput } from '../useFormCompleteness';
import type { SubsystemId } from '@/types';

const fullSubsystem: SubsystemId = {
  instanceId: 'TEST',
  memberClass: 'GOV',
  memberCode: '1234567-8',
  subsystemCode: 'Sub',
};
const partialSubsystem = { ...fullSubsystem, subsystemCode: '' };

describe('useFormCompleteness', () => {
  describe('securityServerComplete', () => {
    it('is false when URL is missing', () => {
      const { securityServerComplete } = useFormCompleteness(() => ({}));
      expect(securityServerComplete.value).toBe(false);
    });

    it('is false for whitespace-only URL', () => {
      const { securityServerComplete } = useFormCompleteness(() => ({
        client: { securityServerUrl: '   ' },
      }));
      expect(securityServerComplete.value).toBe(false);
    });

    it('is true for any non-empty URL', () => {
      const { securityServerComplete } = useFormCompleteness(() => ({
        client: { securityServerUrl: 'https://x' },
      }));
      expect(securityServerComplete.value).toBe(true);
    });
  });

  describe('clientComplete', () => {
    it('is true when all 4 client subsystem fields are filled', () => {
      const { clientComplete } = useFormCompleteness(() => ({
        client: { subsystem: fullSubsystem },
      }));
      expect(clientComplete.value).toBe(true);
    });

    it('is false when any field is missing', () => {
      const { clientComplete } = useFormCompleteness(() => ({
        client: { subsystem: partialSubsystem },
      }));
      expect(clientComplete.value).toBe(false);
    });

    it('is false when client.subsystem is undefined', () => {
      const { clientComplete } = useFormCompleteness(() => ({}));
      expect(clientComplete.value).toBe(false);
    });
  });

  describe('serviceSubsystemComplete + serviceCodeComplete', () => {
    it('serviceSubsystemComplete only checks the subsystem fields', () => {
      const { serviceSubsystemComplete, serviceCodeComplete } = useFormCompleteness(() => ({
        service: { subsystem: fullSubsystem },
      }));
      expect(serviceSubsystemComplete.value).toBe(true);
      expect(serviceCodeComplete.value).toBe(false);
    });

    it('serviceCodeComplete is true when serviceCode is non-empty', () => {
      const { serviceCodeComplete } = useFormCompleteness(() => ({
        service: { subsystem: fullSubsystem, serviceCode: 'getInfo' },
      }));
      expect(serviceCodeComplete.value).toBe(true);
    });
  });

  describe('endpointComplete', () => {
    it('requires both method and path', () => {
      const { endpointComplete } = useFormCompleteness(() => ({
        request: { method: 'GET', path: '/api' },
      }));
      expect(endpointComplete.value).toBe(true);
    });

    it('is false when method is missing', () => {
      const { endpointComplete } = useFormCompleteness(() => ({
        request: { path: '/api' },
      }));
      expect(endpointComplete.value).toBe(false);
    });

    it('is false when path is missing', () => {
      const { endpointComplete } = useFormCompleteness(() => ({
        request: { method: 'GET' },
      }));
      expect(endpointComplete.value).toBe(false);
    });
  });

  describe('queryParametersComplete + customHeadersComplete', () => {
    it('queryParameters is true when at least one entry exists', () => {
      const { queryParametersComplete } = useFormCompleteness(() => ({
        request: { queryParams: { q: 'test' } },
      }));
      expect(queryParametersComplete.value).toBe(true);
    });

    it('queryParameters is false for empty object', () => {
      const { queryParametersComplete } = useFormCompleteness(() => ({
        request: { queryParams: {} },
      }));
      expect(queryParametersComplete.value).toBe(false);
    });

    it('customHeaders mirrors the same logic', () => {
      const { customHeadersComplete } = useFormCompleteness(() => ({
        request: { headers: { 'X-Custom': 'v' } },
      }));
      expect(customHeadersComplete.value).toBe(true);
    });
  });

  describe('certificatesComplete', () => {
    it.each([
      [{}, false],
      [{ securityServerCert: 'pem' }, true],
      [{ clientCert: 'pem' }, true],
      [{ clientPrivateKey: 'pem' }, true],
      [{ clientCert: 'a', clientPrivateKey: 'b' }, true],
    ])('certs %o → %s', (certificates, expected) => {
      const { certificatesComplete } = useFormCompleteness(() => ({ certificates }));
      expect(certificatesComplete.value).toBe(expected);
    });
  });

  describe('reactivity', () => {
    it('re-evaluates when the input getter returns new data', () => {
      const data = ref<FormCompletenessInput>({});
      const { clientComplete } = useFormCompleteness(() => data.value);
      expect(clientComplete.value).toBe(false);

      data.value = { client: { subsystem: fullSubsystem } };
      expect(clientComplete.value).toBe(true);
    });
  });

  describe('pathComplete', () => {
    it('is true when path is non-empty', () => {
      const { pathComplete } = useFormCompleteness(() => ({ request: { path: '/' } }));
      expect(pathComplete.value).toBe(true);
    });

    it('is false when path is empty/missing', () => {
      const { pathComplete } = useFormCompleteness(() => ({ request: {} }));
      expect(pathComplete.value).toBe(false);
    });
  });
});
