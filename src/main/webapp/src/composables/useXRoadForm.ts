import { ref, reactive, computed, watch, onMounted } from 'vue';
import type { XRoadRequest, MTlsCertificates, SubsystemId, ServiceInfo, ServiceEndpoint } from '@/types';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface XRoadFormState {
  client: {
    subsystem: SubsystemId;
    securityServerUrl: string;
  };
  service: {
    subsystem: SubsystemId;
    serviceCode: string;
    serviceVersion: string;
  };
  request: {
    method: HttpMethod;
    path: string;
    body: string;
    contentType: string;
  };
}

export interface UseXRoadFormOptions {
  initialRequest?: XRoadRequest | null;
  isFromHistory?: boolean;
  onFormChange?: (data: XRoadRequest, isValid: boolean, certificates: MTlsCertificates) => void;
  onRequestModified?: () => void;
}

function emptySubsystem(): SubsystemId {
  return {
    instanceId: '',
    memberClass: '',
    memberCode: '',
    subsystemCode: '',
  };
}

export function useXRoadForm(options: UseXRoadFormOptions = {}) {
  const { onFormChange: optionsOnFormChange, onRequestModified: optionsOnRequestModified } = options;

  // Store callbacks that can be set later via setupFormChangeWatcher
  let formChangeCallback: ((data: XRoadRequest, isValid: boolean, certs: MTlsCertificates) => void) | undefined = optionsOnFormChange;
  let requestModifiedCallback: (() => void) | undefined = optionsOnRequestModified;

  // Store pending form change notification if callback not yet registered
  let pendingFormChange: { data: XRoadRequest; isValid: boolean; certs: MTlsCertificates } | null = null;

  // Form state
  const formData = reactive<XRoadFormState>({
    client: {
      subsystem: emptySubsystem(),
      securityServerUrl: '',
    },
    service: {
      subsystem: emptySubsystem(),
      serviceCode: '',
      serviceVersion: '',
    },
    request: {
      method: 'GET',
      path: '',
      body: '',
      contentType: '',
    },
  });

  // Certificates (managed separately, not persisted in history)
  const certificates = ref<MTlsCertificates>({});

  // Key-value lists
  const queryParams = ref<KeyValuePair[]>([]);
  const customHeaders = ref<KeyValuePair[]>([]);

  // UI state
  // Single accordion state covering all six sections. Collapsed by
  // default — matches the "Security Server is Next" state shown by the
  // progress chips on a fresh form. The user expands a section by
  // clicking the corresponding chip (or the accordion header).
  // Possible values: 'client', 'service', 'endpoint', 'queryParams',
  // 'customHeaders', 'certificates'.
  const openPanels = ref<string[]>([]);

  // Track initial load state
  const isInitialLoad = ref(true);
  const isFromHistory = ref(options.isFromHistory ?? false);

  // Available services from selected service provider
  const availableServices = ref<ServiceInfo[]>([]);

  // Computed endpoints for selected service
  const selectedServiceEndpoints = computed<ServiceEndpoint[]>(() => {
    if (!formData.service.serviceCode || availableServices.value.length === 0) {
      return [];
    }
    const selectedService = availableServices.value.find(
      (s) => s.serviceCode === formData.service.serviceCode
    );
    return selectedService?.endpoints ?? [];
  });

  // Build XRoadRequest from form data
  function buildRequest(): XRoadRequest {
    const request: XRoadRequest = {
      client: {
        subsystem: { ...formData.client.subsystem },
        securityServerUrl: formData.client.securityServerUrl,
      },
      service: {
        subsystem: { ...formData.service.subsystem },
        serviceCode: formData.service.serviceCode,
        serviceVersion: formData.service.serviceVersion || undefined,
      },
      request: {
        method: formData.request.method,
        path: formData.request.path,
        body: formData.request.body || undefined,
        contentType: formData.request.contentType || undefined,
      },
    };

    // Add mTLS certificates if any are provided
    const hasAnyCertificate =
      certificates.value.securityServerCert?.trim() ||
      certificates.value.clientCert?.trim() ||
      certificates.value.clientPrivateKey?.trim();

    if (hasAnyCertificate) {
      request.client.mtlsCertificates = {
        securityServerCert: certificates.value.securityServerCert?.trim() || undefined,
        clientCert: certificates.value.clientCert?.trim() || undefined,
        clientPrivateKey: certificates.value.clientPrivateKey?.trim() || undefined,
      };
    }

    // Convert queryParams array to object
    if (queryParams.value.length > 0) {
      const params: Record<string, string> = {};
      queryParams.value.forEach((param) => {
        if (param.key && param.value) {
          params[param.key] = param.value;
        }
      });
      if (Object.keys(params).length > 0) {
        request.request.queryParams = params;
      }
    }

    // Convert customHeaders array to object
    if (customHeaders.value.length > 0) {
      const headers: Record<string, string> = {};
      customHeaders.value.forEach((header) => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
      if (Object.keys(headers).length > 0) {
        request.request.headers = headers;
      }
    }

    return request;
  }

  // Populate form from request
  function populateFromRequest(request: XRoadRequest): void {
    isInitialLoad.value = true;

    // Client
    formData.client.subsystem = { ...request.client.subsystem };
    formData.client.securityServerUrl = request.client.securityServerUrl;

    // Service
    formData.service.subsystem = { ...request.service.subsystem };
    formData.service.serviceCode = request.service.serviceCode;
    formData.service.serviceVersion = request.service.serviceVersion ?? '';

    // Request
    formData.request.method = request.request.method as HttpMethod;
    formData.request.path = request.request.path;
    formData.request.body = request.request.body ?? '';
    formData.request.contentType = request.request.contentType ?? '';

    // Query params
    if (request.request.queryParams) {
      queryParams.value = Object.entries(request.request.queryParams).map(([key, value], index) => ({
        id: `qp-${Date.now()}-${index}`,
        key,
        value,
      }));
    } else {
      queryParams.value = [];
    }

    // Custom headers
    if (request.request.headers) {
      customHeaders.value = Object.entries(request.request.headers).map(([key, value], index) => ({
        id: `ch-${Date.now()}-${index}`,
        key,
        value,
      }));
    } else {
      customHeaders.value = [];
    }

    // Certificates are NOT populated from history for security
    certificates.value = {};

    setTimeout(() => {
      isInitialLoad.value = false;
      const request = buildRequest();
      if (formChangeCallback) {
        formChangeCallback(request, true, certificates.value);
      } else {
        // Store pending notification for when callback is registered
        pendingFormChange = { data: request, isValid: true, certs: { ...certificates.value } };
      }
    }, 0);
  }

  // Clear handlers
  function clearClient(): void {
    formData.client.subsystem = emptySubsystem();
  }

  function clearSecurityServerUrl(): void {
    formData.client.securityServerUrl = '';
  }

  function clearService(): void {
    formData.service.subsystem = emptySubsystem();
    formData.service.serviceCode = '';
    formData.service.serviceVersion = '';
  }

  function clearRequest(): void {
    formData.request.method = 'GET';
    formData.request.path = '';
    formData.request.body = '';
    formData.request.contentType = '';
    queryParams.value = [];
    customHeaders.value = [];
  }

  // Query param handlers
  function addQueryParam(): void {
    queryParams.value.push({ id: `qp-${Date.now()}-${Math.random()}`, key: '', value: '' });
  }

  function removeQueryParam(index: number): void {
    queryParams.value.splice(index, 1);
  }

  function updateQueryParam(index: number, field: 'key' | 'value', value: string): void {
    queryParams.value[index][field] = value;
  }

  function clearQueryParams(): void {
    queryParams.value = [];
  }

  // Custom header handlers
  function addCustomHeader(): void {
    customHeaders.value.push({ id: `ch-${Date.now()}-${Math.random()}`, key: '', value: '' });
  }

  function removeCustomHeader(index: number): void {
    customHeaders.value.splice(index, 1);
  }

  function updateCustomHeader(index: number, field: 'key' | 'value', value: string): void {
    customHeaders.value[index][field] = value;
  }

  function clearCustomHeaders(): void {
    customHeaders.value = [];
  }

  // Set available services
  function setAvailableServices(services: ServiceInfo[]): void {
    availableServices.value = services;
  }

  // Computed snapshot for watching changes
  const formDataSnapshot = computed(() => ({
    clientInstanceId: formData.client.subsystem.instanceId,
    clientMemberClass: formData.client.subsystem.memberClass,
    clientMemberCode: formData.client.subsystem.memberCode,
    clientSubsystemCode: formData.client.subsystem.subsystemCode,
    securityServerUrl: formData.client.securityServerUrl,
    serviceInstanceId: formData.service.subsystem.instanceId,
    serviceMemberClass: formData.service.subsystem.memberClass,
    serviceMemberCode: formData.service.subsystem.memberCode,
    serviceSubsystemCode: formData.service.subsystem.subsystemCode,
    serviceCode: formData.service.serviceCode,
    serviceVersion: formData.service.serviceVersion,
    method: formData.request.method,
    path: formData.request.path,
    body: formData.request.body,
    contentType: formData.request.contentType,
    queryParamsCount: queryParams.value.length,
    customHeadersCount: customHeaders.value.length,
    certificatesCount: Object.keys(certificates.value).length,
  }));

  // Watch for initial request prop changes. Populate the form whenever
  // a request is provided (history reload, cURL import, future sources).
  // The isFromHistory flag is propagated separately and gates the
  // "loaded from history" UI affordances, not the population itself.
  function watchInitialRequest(
    requestGetter: () => XRoadRequest | null | undefined,
    isFromHistoryGetter: () => boolean
  ): void {
    watch(
      requestGetter,
      (newRequest) => {
        if (newRequest) {
          isFromHistory.value = isFromHistoryGetter();
          populateFromRequest(newRequest);
        }
      },
      { immediate: true }
    );
  }

  // Setup form change watcher
  function setupFormChangeWatcher(
    errorsGetter: () => Record<string, string>,
    onChange?: (data: XRoadRequest, isValid: boolean, certs: MTlsCertificates) => void,
    onModified?: () => void
  ): void {
    // Store callbacks for use by populateFromRequest
    if (onChange) {
      formChangeCallback = onChange;
    }
    if (onModified) {
      requestModifiedCallback = onModified;
    }

    // Process any pending form change notification
    if (pendingFormChange && formChangeCallback) {
      formChangeCallback(pendingFormChange.data, pendingFormChange.isValid, pendingFormChange.certs);
      pendingFormChange = null;
    }

    watch(
      formDataSnapshot,
      () => {
        if (!isInitialLoad.value) {
          const errors = errorsGetter();
          formChangeCallback?.(buildRequest(), Object.keys(errors).length === 0, certificates.value);
          if (isFromHistory.value) {
            requestModifiedCallback?.();
          }
        }
      },
      { deep: true }
    );
  }

  // Initialize after mount
  function initializeAfterMount(): void {
    onMounted(() => {
      setTimeout(() => {
        if (isInitialLoad.value) {
          isInitialLoad.value = false;
        }
      }, 0);
    });
  }

  return {
    // State
    formData,
    certificates,
    queryParams,
    customHeaders,
    openPanels,
    isInitialLoad,
    isFromHistory,
    availableServices,
    selectedServiceEndpoints,
    formDataSnapshot,

    // Actions
    buildRequest,
    populateFromRequest,
    clearClient,
    clearSecurityServerUrl,
    clearService,
    clearRequest,
    addQueryParam,
    removeQueryParam,
    updateQueryParam,
    clearQueryParams,
    addCustomHeader,
    removeCustomHeader,
    updateCustomHeader,
    clearCustomHeaders,
    setAvailableServices,

    // Setup helpers
    watchInitialRequest,
    setupFormChangeWatcher,
    initializeAfterMount,
  };
}
