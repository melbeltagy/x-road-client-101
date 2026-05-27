import { reactive, ref, watch, onMounted, getCurrentInstance } from "vue";
import type { XRoadRequest, MTlsCertificates, SubsystemId } from "@/types";
import type { HttpMethod } from "@/utils/http-methods";
import { emptySubsystem } from "@/utils/subsystem";
import { useKeyValueList, type KeyValuePair } from "./useKeyValueList";

export type { SubsystemId };

export type { HttpMethod, KeyValuePair };

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
  /** Reactive source for the request to populate from (e.g., history reload). */
  initialRequestGetter?: () => XRoadRequest | null | undefined;
  /** Set when populate is from a history reload — gates the "loaded from history" UI. */
  isFromHistoryGetter?: () => boolean;
  /** Validity check: returns the current validation errors map. */
  errorsGetter?: () => Record<string, string>;
  /** Fires on every form mutation after the initial load settles. */
  onFormChange?: (data: XRoadRequest, isValid: boolean, certificates: MTlsCertificates) => void;
  /** Fires when the user edits a request that was just loaded from history. */
  onRequestModified?: () => void;
}

export function useXRoadForm(options: UseXRoadFormOptions = {}) {
  // Form state
  const formData = reactive<XRoadFormState>({
    client: {
      subsystem: emptySubsystem(),
      securityServerUrl: "",
    },
    service: {
      subsystem: emptySubsystem(),
      serviceCode: "",
      serviceVersion: "",
    },
    request: {
      method: "GET",
      path: "",
      body: "",
      contentType: "",
    },
  });

  // Certificates (managed separately, not persisted in history)
  const certificates = ref<MTlsCertificates>({});

  // Key-value lists (queryParams, customHeaders)
  const queryParamsList = useKeyValueList("qp");
  const customHeadersList = useKeyValueList("ch");
  const queryParams = queryParamsList.items;
  const customHeaders = customHeadersList.items;

  // UI state: single accordion across all six sections. Collapsed by
  // default — the SS URL field sits above the accordion; the user
  // expands a section by clicking its progress chip (or the header).
  const openPanels = ref<string[]>([]);

  // Initial-load gate: suppresses onFormChange while populateFromRequest
  // is writing fields, so a programmatic populate doesn't get reported
  // back as a user edit.
  const isInitialLoad = ref(true);
  const isFromHistory = ref(false);

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

    const hasAnyCertificate =
      certificates.value.securityServerCert?.trim() || certificates.value.clientCert?.trim() || certificates.value.clientPrivateKey?.trim();

    if (hasAnyCertificate) {
      request.client.mtlsCertificates = {
        securityServerCert: certificates.value.securityServerCert?.trim() || undefined,
        clientCert: certificates.value.clientCert?.trim() || undefined,
        clientPrivateKey: certificates.value.clientPrivateKey?.trim() || undefined,
      };
    }

    const qp = queryParamsList.toRecord();
    if (qp) request.request.queryParams = qp;

    const ch = customHeadersList.toRecord();
    if (ch) request.request.headers = ch;

    return request;
  }

  function populateFromRequest(request: XRoadRequest): void {
    isInitialLoad.value = true;

    formData.client.subsystem = { ...request.client.subsystem };
    formData.client.securityServerUrl = request.client.securityServerUrl;

    formData.service.subsystem = { ...request.service.subsystem };
    formData.service.serviceCode = request.service.serviceCode;
    formData.service.serviceVersion = request.service.serviceVersion ?? "";

    formData.request.method = request.request.method as HttpMethod;
    formData.request.path = request.request.path;
    formData.request.body = request.request.body ?? "";
    formData.request.contentType = request.request.contentType ?? "";

    queryParamsList.setFromRecord(request.request.queryParams);
    customHeadersList.setFromRecord(request.request.headers);

    // Certificates are NOT populated from history for security
    certificates.value = {};

    // Defer the change notification past the synchronous reactive flush
    // so consumers see the fully-populated form, not an intermediate state.
    setTimeout(() => {
      isInitialLoad.value = false;
      options.onFormChange?.(buildRequest(), true, certificates.value);
    }, 0);
  }

  // Clear handlers
  function clearClient(): void {
    formData.client.subsystem = emptySubsystem();
  }

  function clearService(): void {
    formData.service.subsystem = emptySubsystem();
    formData.service.serviceCode = "";
    formData.service.serviceVersion = "";
  }

  function clearRequest(): void {
    formData.request.method = "GET";
    formData.request.path = "";
    formData.request.body = "";
    formData.request.contentType = "";
    queryParamsList.clear();
    customHeadersList.clear();
  }

  const { add: addQueryParam, remove: removeQueryParam, update: updateQueryParam, clear: clearQueryParams } = queryParamsList;
  const { add: addCustomHeader, remove: removeCustomHeader, update: updateCustomHeader, clear: clearCustomHeaders } = customHeadersList;

  // Form change watcher — callbacks captured at construction, so no
  // pending-queue needed. The isInitialLoad gate prevents programmatic
  // populates from being reported back as edits.
  //
  // Deep watch covers every field of formData + certificates + the two
  // key-value lists without us having to enumerate them — adding a
  // field to formData won't silently bypass the notifier.
  if (options.onFormChange || options.onRequestModified) {
    watch(
      [() => formData, certificates, queryParams, customHeaders],
      () => {
        if (isInitialLoad.value) return;
        const errors = options.errorsGetter?.() ?? {};
        options.onFormChange?.(buildRequest(), Object.keys(errors).length === 0, certificates.value);
        if (isFromHistory.value) {
          options.onRequestModified?.();
        }
      },
      { deep: true },
    );
  }

  // Initial-request watcher: populate whenever a request is provided
  // (history reload, cURL import, future sources).
  if (options.initialRequestGetter) {
    watch(
      options.initialRequestGetter,
      (newRequest) => {
        if (newRequest) {
          isFromHistory.value = options.isFromHistoryGetter?.() ?? false;
          populateFromRequest(newRequest);
        }
      },
      { immediate: true },
    );
  }

  // After mount, clear the initial-load gate so subsequent edits report
  // through onFormChange. Skipped outside a component (e.g. unit tests).
  if (getCurrentInstance()) {
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

    // Actions
    buildRequest,
    populateFromRequest,
    clearClient,
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
  };
}
