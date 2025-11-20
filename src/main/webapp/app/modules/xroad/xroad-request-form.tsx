import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Form } from 'reactstrap';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { CertificateType, MTlsCertificates } from 'app/shared/model/mtls-certificates.model';
import { ClientSection } from './components/client-section';
import { ServiceSection } from './components/service-section';
import { RequestSection } from './components/request-section';
import { CertificateSection } from './components/certificate-section';
import { AdvancedSection } from './components/advanced-section';
import { KeyValuePair } from './components/key-value-pair-list';

interface XRoadRequestFormProps {
  onSubmit: (data: XRoadRequest) => Promise<void>;
  initialRequest?: XRoadRequest | null;
  isFromHistory?: boolean;
  onRequestModified?: () => void;
  onFormChange?: (formData: Partial<XRoadRequest>, isValid: boolean, submitHandler: () => void, certificates: MTlsCertificates) => void;
}

export const XRoadRequestForm: React.FC<XRoadRequestFormProps> = ({
  onSubmit,
  initialRequest,
  isFromHistory,
  onRequestModified,
  onFormChange,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<XRoadRequest>({
    mode: 'onSubmit', // Validate only when form is submitted
    reValidateMode: 'onChange', // After submit, re-validate on change (clears errors as you type)
    defaultValues: {
      request: {
        method: 'GET',
      },
    },
  });

  // Watch request body to show/hide Content-Type field
  const requestBody = useWatch({ control, name: 'request.body' });

  // Watch all form values to detect modifications
  const formValues = useWatch({ control });

  // Certificate management state (must be declared before useEffect that uses it)
  const [certificates, setCertificates] = useState<MTlsCertificates>({});

  // Notify parent of form changes for status panel
  useEffect(() => {
    if (onFormChange && formValues) {
      const submitHandler = () => {
        handleSubmit(handleFormSubmit)();
      };
      onFormChange(formValues as Partial<XRoadRequest>, isValid, submitHandler, certificates);
    }
  }, [formValues, isValid, onFormChange, certificates]);

  // Transform form data before submission to clean up null/empty values
  const handleFormSubmit = (data: XRoadRequest) => {
    // Add mTLS certificates if any are provided
    const hasAnyCertificate =
      (certificates.securityServerCert && certificates.securityServerCert.trim() !== '') ||
      (certificates.clientCert && certificates.clientCert.trim() !== '') ||
      (certificates.clientPrivateKey && certificates.clientPrivateKey.trim() !== '');

    if (hasAnyCertificate) {
      data.client.mtlsCertificates = {
        securityServerCert: certificates.securityServerCert?.trim() || undefined,
        clientCert: certificates.clientCert?.trim() || undefined,
        clientPrivateKey: certificates.clientPrivateKey?.trim() || undefined,
      };
    }

    // Clean up optional serviceVersion - convert empty string to undefined
    if (data.service.serviceVersion === '') {
      data.service.serviceVersion = undefined;
    }

    // Convert queryParams array to object
    if (queryParams.length > 0) {
      const params: Record<string, string> = {};
      queryParams.forEach(param => {
        if (param.key && param.value) {
          params[param.key] = param.value;
        }
      });
      data.request.queryParams = Object.keys(params).length > 0 ? params : undefined;
    }

    // Convert customHeaders array to object
    if (customHeaders.length > 0) {
      const headers: Record<string, string> = {};
      customHeaders.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
      data.request.headers = Object.keys(headers).length > 0 ? headers : undefined;
    }

    // Clean up empty X-Road headers
    if (data.request.xroadId === '') data.request.xroadId = undefined;
    if (data.request.xroadUserId === '') data.request.xroadUserId = undefined;
    if (data.request.xroadIssue === '') data.request.xroadIssue = undefined;
    if (data.request.xroadRepresentedParty === '') data.request.xroadRepresentedParty = undefined;

    // Clean up empty Content-Type
    if (data.request.contentType === '') data.request.contentType = undefined;

    return onSubmit(data);
  };

  // Collapsible section states
  const [clientOpen, setClientOpen] = useState(true);
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(true);
  const [requestOpen, setRequestOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([]);
  const [customHeaders, setCustomHeaders] = useState<KeyValuePair[]>([]);

  // T094: Populate form from initialRequest when provided
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Only populate form from initialRequest when loading from history
    // Don't reset the form when submitting new requests
    if (initialRequest && isFromHistory) {
      // Mark that we're loading initial data (don't trigger modification)
      setIsInitialLoad(true);

      // Reset form with initial request data
      reset(initialRequest);

      // Populate query parameters
      if (initialRequest.request.queryParams) {
        const params: KeyValuePair[] = Object.entries(initialRequest.request.queryParams).map(([key, value], index) => ({
          id: `qp-${Date.now()}-${index}`,
          key,
          value,
        }));
        setQueryParams(params);
      } else {
        setQueryParams([]);
      }

      // Populate custom headers
      if (initialRequest.request.headers) {
        const headers: KeyValuePair[] = Object.entries(initialRequest.request.headers).map(([key, value], index) => ({
          id: `ch-${Date.now()}-${index}`,
          key,
          value,
        }));
        setCustomHeaders(headers);
      } else {
        setCustomHeaders([]);
      }

      // Note: Certificates are not populated from history for security reasons
      // They are excluded in the reducer (xroad-history.ts)
      setCertificates({});

      // After initial load is complete, allow modification detection
      // Use setTimeout to ensure all state updates complete first
      setTimeout(() => setIsInitialLoad(false), 0);
    }
  }, [initialRequest, isFromHistory, reset]);

  // T095: Notify parent when any field is modified (triggered by form value changes)
  useEffect(() => {
    // Only notify if:
    // 1. We're viewing history
    // 2. Form values change
    // 3. NOT during initial load (when form is being populated from history)
    if (isFromHistory && onRequestModified && !isInitialLoad) {
      onRequestModified();
    }
  }, [formValues, queryParams, customHeaders, certificates]); // Trigger on any form change including certificates

  // Helper to notify modification for manual state changes
  const notifyModification = useCallback(() => {
    if (onRequestModified) {
      onRequestModified();
    }
  }, [onRequestModified]);

  const handleClearClient = useCallback(() => {
    setValue('client.subsystem.instanceId', '');
    setValue('client.subsystem.memberClass', '');
    setValue('client.subsystem.memberCode', '');
    setValue('client.subsystem.subsystemCode', '');
    setValue('client.securityServerUrl', '');
    // Note: Certificates are NOT cleared here - they persist across requests
    // User must manually delete them if needed
  }, [setValue]);

  const handleCertificateUpdate = useCallback((type: CertificateType, value: string) => {
    setCertificates(prev => ({
      ...prev,
      [type]: value,
    }));
  }, []);

  const handleClearService = useCallback(() => {
    setValue('service.subsystem.instanceId', '');
    setValue('service.subsystem.memberClass', '');
    setValue('service.subsystem.memberCode', '');
    setValue('service.subsystem.subsystemCode', '');
    setValue('service.serviceCode', '');
    setValue('service.serviceVersion', '');
  }, [setValue]);

  const handleClearRequest = useCallback(() => {
    setValue('request.method', 'GET');
    setValue('request.path', '');
    setValue('request.body', '');
    setValue('request.contentType', '');
    setValue('request.xroadId', '');
    setValue('request.xroadUserId', '');
    setValue('request.xroadIssue', '');
    setValue('request.xroadRepresentedParty', '');
    setQueryParams([]);
    setCustomHeaders([]);
  }, [setValue]);

  const addQueryParam = useCallback(() => {
    setQueryParams(prev => [...prev, { id: `qp-${Date.now()}-${Math.random()}`, key: '', value: '' }]);
    notifyModification();
  }, [notifyModification]);

  const removeQueryParam = useCallback(
    (index: number) => {
      setQueryParams(prev => prev.filter((_, i) => i !== index));
      notifyModification();
    },
    [notifyModification],
  );

  const updateQueryParam = useCallback(
    (index: number, field: 'key' | 'value', value: string) => {
      setQueryParams(prev => {
        const updated = [...prev];
        updated[index][field] = value;
        return updated;
      });
      notifyModification();
    },
    [notifyModification],
  );

  const addCustomHeader = useCallback(() => {
    setCustomHeaders(prev => [...prev, { id: `ch-${Date.now()}-${Math.random()}`, key: '', value: '' }]);
    notifyModification();
  }, [notifyModification]);

  const removeCustomHeader = useCallback(
    (index: number) => {
      setCustomHeaders(prev => prev.filter((_, i) => i !== index));
      notifyModification();
    },
    [notifyModification],
  );

  const updateCustomHeader = useCallback(
    (index: number, field: 'key' | 'value', value: string) => {
      setCustomHeaders(prev => {
        const updated = [...prev];
        updated[index][field] = value;
        return updated;
      });
      notifyModification();
    },
    [notifyModification],
  );

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Client Section */}
      <ClientSection
        register={register}
        errors={errors}
        onClear={handleClearClient}
        isOpen={clientOpen}
        onToggle={() => setClientOpen(!clientOpen)}
      />

      {/* Certificate Section */}
      <CertificateSection
        certificates={certificates}
        onCertificateUpdate={handleCertificateUpdate}
        isOpen={certificatesOpen}
        onToggle={() => setCertificatesOpen(!certificatesOpen)}
      />

      {/* Service Section */}
      <ServiceSection
        register={register}
        errors={errors}
        onClear={handleClearService}
        isOpen={serviceOpen}
        onToggle={() => setServiceOpen(!serviceOpen)}
      />

      {/* Request Details Section */}
      <RequestSection
        register={register}
        errors={errors}
        onClear={handleClearRequest}
        requestBody={requestBody || ''}
        isOpen={requestOpen}
        onToggle={() => setRequestOpen(!requestOpen)}
      />

      {/* Advanced Configuration Section */}
      <AdvancedSection
        register={register}
        queryParams={queryParams}
        customHeaders={customHeaders}
        onAddQueryParam={addQueryParam}
        onRemoveQueryParam={removeQueryParam}
        onUpdateQueryParam={updateQueryParam}
        onAddCustomHeader={addCustomHeader}
        onRemoveCustomHeader={removeCustomHeader}
        onUpdateCustomHeader={updateCustomHeader}
        isOpen={advancedOpen}
        onToggle={() => setAdvancedOpen(!advancedOpen)}
      />
    </Form>
  );
};
