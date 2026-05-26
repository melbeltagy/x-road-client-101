import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubsystemId } from '@/types';
import type { XRoadFormState } from './useXRoadForm';

/** @deprecated use `XRoadFormState` from `useXRoadForm` — kept for back-compat. */
export type XRoadFormData = XRoadFormState;

export function useXRoadValidation() {
  const { t } = useI18n();
  const errors = ref<Record<string, string>>({});

  const isValid = computed(() => Object.keys(errors.value).length === 0);

  function validateSubsystem(
    subsystem: SubsystemId,
    prefix: 'client' | 'service',
    newErrors: Record<string, string>
  ): void {
    // Instance ID
    if (!subsystem.instanceId) {
      newErrors[`${prefix}.subsystem.instanceId`] = t('xroad.validation.required');
    } else if (!/^[A-Za-z0-9-]{2,}$/.test(subsystem.instanceId)) {
      newErrors[`${prefix}.subsystem.instanceId`] = t('xroad.validation.instanceId');
    }

    // Member Class
    if (!subsystem.memberClass) {
      newErrors[`${prefix}.subsystem.memberClass`] = t('xroad.validation.required');
    } else if (!/^[A-Za-z0-9-]+$/.test(subsystem.memberClass)) {
      newErrors[`${prefix}.subsystem.memberClass`] = t('xroad.validation.memberClass');
    }

    // Member Code
    if (!subsystem.memberCode) {
      newErrors[`${prefix}.subsystem.memberCode`] = t('xroad.validation.required');
    } else if (!/^[A-Za-z0-9-]+$/.test(subsystem.memberCode)) {
      newErrors[`${prefix}.subsystem.memberCode`] = t('xroad.validation.memberCode');
    }

    // Subsystem Code
    if (!subsystem.subsystemCode) {
      newErrors[`${prefix}.subsystem.subsystemCode`] = t('xroad.validation.required');
    } else if (!/^[A-Za-z0-9-]+$/.test(subsystem.subsystemCode)) {
      newErrors[`${prefix}.subsystem.subsystemCode`] = t('xroad.validation.subsystemCode');
    }
  }

  function validateSecurityServerUrl(url: string, newErrors: Record<string, string>): void {
    if (!url) {
      newErrors['client.securityServerUrl'] = t('xroad.validation.required');
      return;
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrlProtocol');
      } else if (parsed.hostname.includes('_')) {
        newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrlUnderscore');
      } else if (!parsed.hostname) {
        newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrlHostname');
      }
    } catch {
      newErrors['client.securityServerUrl'] = t('xroad.validation.securityServerUrl');
    }
  }

  function validateServiceCode(serviceCode: string, newErrors: Record<string, string>): void {
    if (!serviceCode) {
      newErrors['service.serviceCode'] = t('xroad.validation.required');
    } else if (!/^[A-Za-z0-9_-]+$/.test(serviceCode)) {
      newErrors['service.serviceCode'] = t('xroad.validation.serviceCode');
    }
  }

  function validateServiceVersion(serviceVersion: string, newErrors: Record<string, string>): void {
    if (serviceVersion && !/^v?[0-9]+(\.[0-9]+)*$/.test(serviceVersion)) {
      newErrors['service.serviceVersion'] = t('xroad.validation.serviceVersion');
    }
  }

  function validateRequest(
    request: { method: string; path: string },
    newErrors: Record<string, string>
  ): void {
    if (!request.method) {
      newErrors['request.method'] = t('xroad.validation.method');
    }

    if (!request.path) {
      newErrors['request.path'] = t('xroad.validation.required');
    } else if (!/^\/[A-Za-z0-9/_-]*$/.test(request.path)) {
      newErrors['request.path'] = t('xroad.validation.path');
    }
  }

  function validateForm(formData: XRoadFormState): boolean {
    const newErrors: Record<string, string> = {};

    // Validate client subsystem
    validateSubsystem(formData.client.subsystem, 'client', newErrors);

    // Validate security server URL
    validateSecurityServerUrl(formData.client.securityServerUrl, newErrors);

    // Validate service subsystem
    validateSubsystem(formData.service.subsystem, 'service', newErrors);

    // Validate service code and version
    validateServiceCode(formData.service.serviceCode, newErrors);
    validateServiceVersion(formData.service.serviceVersion, newErrors);

    // Validate request
    validateRequest(formData.request, newErrors);

    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function clearErrors(): void {
    errors.value = {};
  }

  return {
    errors,
    isValid,
    validateForm,
    clearErrors,
  };
}
