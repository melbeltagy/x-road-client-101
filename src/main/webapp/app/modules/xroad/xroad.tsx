import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Col, Container, Row } from 'reactstrap';
import { Translate, translate } from 'app/shared/i18n';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { XRoadRequestForm } from './xroad-request-form';
import { XRoadResponseViewer } from './xroad-response-viewer';
import { HistoryList } from './components/history-list';
import { RequestStatusPanel } from './components/request-status-panel';
import { xroadProxyService } from 'app/shared/services/xroad-proxy.service';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { XRoadResponse } from 'app/shared/model/xroad-response.model';
import { MTlsCertificates } from 'app/shared/model/mtls-certificates.model';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { addRequestToHistory, deleteHistoryEntry, RequestHistoryEntry, selectHistoryEntry } from 'app/shared/reducers/xroad-history';

export const XRoad: React.FC = () => {
  const dispatch = useAppDispatch();
  const { entries: historyEntries, selectedEntryId } = useAppSelector(state => state.xroadHistory);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<XRoadResponse | null>(null);
  const [currentRequest, setCurrentRequest] = useState<XRoadRequest | null>(null);
  const [isFromHistory, setIsFromHistory] = useState(false);

  // Track if we've done the initial auto-load
  const hasAutoLoaded = useRef(false);

  // State for status panel
  const [formData, setFormData] = useState<Partial<XRoadRequest>>({});
  const [formValid, setFormValid] = useState(false);
  const [formSubmitHandler, setFormSubmitHandler] = useState<(() => void) | null>(null);
  const [certificates, setCertificates] = useState<MTlsCertificates>({});

  // State for alert notifications
  const [alert, setAlert] = useState<{ visible: boolean; color: 'success' | 'danger' | 'warning'; message: string }>({
    visible: false,
    color: 'success',
    message: '',
  });

  // Helper function to show alerts
  const showAlert = (color: 'success' | 'danger' | 'warning', message: string) => {
    setAlert({ visible: true, color, message });
  };

  // T093: Auto-load most recent request on page load
  useEffect(() => {
    if (historyEntries.length > 0 && !hasAutoLoaded.current) {
      const mostRecent = historyEntries[0];
      setCurrentRequest(mostRecent.request);
      setResponse(mostRecent.response);
      setIsFromHistory(true);
      setAlert({ visible: false, color: 'success', message: '' }); // Hide request alerts when auto-loading history
      dispatch(selectHistoryEntry(mostRecent.id));
      hasAutoLoaded.current = true;
    }
  }, [historyEntries, dispatch]); // Run when historyEntries changes, but only auto-load once

  const handleSubmit = async (data: XRoadRequest) => {
    setLoading(true);
    setResponse(null);
    setCurrentRequest(data);
    setIsFromHistory(false); // Clear history indicator when submitting new request

    try {
      const result = await xroadProxyService.executeRequest(data);
      setResponse(result);

      // T099: Dispatch addRequestToHistory after successful response
      dispatch(
        addRequestToHistory({
          request: data,
          response: result,
        }),
      );

      if (result.statusCode === 0) {
        showAlert('danger', translate('xroad.toast.requestFailed') + ': ' + result.body);
      } else if (result.statusCode >= 200 && result.statusCode < 300) {
        showAlert('success', `${translate('xroad.toast.requestSuccessful')} (${result.statusCode})`);
      } else if (result.xroadError) {
        showAlert('danger', `${translate('xroad.toast.xroadError')}: ${result.xroadError.message}`);
      } else {
        showAlert('warning', `${translate('xroad.toast.response')}: ${result.statusCode} ${result.statusText}`);
      }
    } catch (error: any) {
      console.error('X-Road request error:', error);

      const responseData = error.response?.data;

      // If we have response data (any JSON object), display it completely
      if (responseData && typeof responseData === 'object') {
        // Always display the entire response object as formatted JSON in the body
        const fullResponseJson = JSON.stringify(responseData, null, 2);

        // Extract error message for toast notification
        let errorMessage = translate('xroad.toast.unknownError');
        if ('body' in responseData) {
          // XRoadResponse format
          errorMessage = responseData.body || responseData.statusText || errorMessage;
        } else if ('detail' in responseData) {
          // Spring Boot Problem Details format
          errorMessage = responseData.detail || responseData.message || errorMessage;
        } else if ('message' in responseData) {
          // Generic error format
          errorMessage = responseData.message;
        }

        showAlert('danger', `${translate('xroad.toast.error')}: ${errorMessage}`);

        // Create response object with full JSON in body
        const errorResponse: XRoadResponse = {
          statusCode: error.response?.status || 0,
          statusText: error.response?.statusText || translate('xroad.toast.clientError'),
          headers: {}, // Don't include axios headers - they have wrong format
          body: fullResponseJson,
          contentType: 'application/json',
          contentLength: null,
          timestamp: new Date().toISOString(),
        };

        setResponse(errorResponse);

        // Also add error response to history
        dispatch(
          addRequestToHistory({
            request: data,
            response: errorResponse,
          }),
        );
      } else {
        // Generic error (network error, no response data, etc.)
        const errorMessage = error.message || translate('xroad.toast.unknownError');
        showAlert('danger', `${translate('xroad.toast.error')}: ${errorMessage}`);

        const errorResponse: XRoadResponse = {
          statusCode: 0,
          statusText: translate('xroad.toast.clientError'),
          headers: {}, // Empty object for optional headers
          body: errorMessage,
          timestamp: new Date().toISOString(),
        };

        setResponse(errorResponse);

        // Add generic error to history
        dispatch(
          addRequestToHistory({
            request: data,
            response: errorResponse,
          }),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // T096: Implement View action handler - single click loads request + response (sidebar stays open)
  const handleView = (entry: RequestHistoryEntry) => {
    setCurrentRequest(entry.request);
    setResponse(entry.response);
    setIsFromHistory(true);
    setAlert({ ...alert, visible: false }); // Hide request alerts when viewing history
    dispatch(selectHistoryEntry(entry.id));
  };

  // T098: Implement Delete action handler
  const handleDelete = (entryId: string) => {
    dispatch(deleteHistoryEntry(entryId));
    showAlert('success', translate('xroad.history.deleted'));

    // If deleted entry was current, load the most recent
    if (selectedEntryId === entryId && historyEntries.length > 0) {
      const nextEntry = historyEntries.find(e => e.id !== entryId);
      if (nextEntry) {
        setCurrentRequest(nextEntry.request);
        setResponse(nextEntry.response);
        setIsFromHistory(true);
      } else {
        setCurrentRequest(null);
        setResponse(null);
        setIsFromHistory(false);
      }
    }
  };

  // T095: Clear history indicator when request is modified
  const handleRequestModified = () => {
    if (isFromHistory) {
      setIsFromHistory(false);
      setResponse(null);
    }
  };

  // Handle form changes for status panel - memoized to prevent infinite re-renders
  const handleFormChange = useCallback(
    (data: Partial<XRoadRequest>, isValid: boolean, submitHandler: () => void, certs: MTlsCertificates) => {
      setFormData(data);
      setFormValid(isValid);
      setFormSubmitHandler(() => submitHandler);
      setCertificates(certs);
    },
    [],
  );

  return (
    <Container fluid className="mt-4">
      {/* Alert notifications */}
      {alert.visible && (
        <Row className="mt-3">
          <Col>
            <Alert color={alert.color} toggle={() => setAlert({ ...alert, visible: false })} className="mb-0">
              {alert.message}
            </Alert>
          </Col>
        </Row>
      )}

      {/* History indicator */}
      {isFromHistory && (
        <Row className="mt-3">
          <Col>
            <Alert color="info" toggle={() => setIsFromHistory(false)} className="mb-0">
              <FontAwesomeIcon icon="history" className="me-2" />
              <Translate contentKey="xroad.history.indicator">This request is from history</Translate>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Request Status Panel */}
      <RequestStatusPanel
        client={{
          subsystem: {
            instanceId: formData.client?.subsystem?.instanceId,
            memberClass: formData.client?.subsystem?.memberClass,
            memberCode: formData.client?.subsystem?.memberCode,
            subsystemCode: formData.client?.subsystem?.subsystemCode,
          },
          securityServerUrl: formData.client?.securityServerUrl,
        }}
        service={{
          subsystem: {
            instanceId: formData.service?.subsystem?.instanceId,
            memberClass: formData.service?.subsystem?.memberClass,
            memberCode: formData.service?.subsystem?.memberCode,
            subsystemCode: formData.service?.subsystem?.subsystemCode,
          },
          serviceCode: formData.service?.serviceCode,
          serviceVersion: formData.service?.serviceVersion,
        }}
        requestPath={formData.request?.path}
        certificates={certificates}
        lastRequestSuccess={response ? (response.statusCode >= 200 && response.statusCode < 300 ? true : false) : null}
        loading={loading}
        onSubmit={() => formSubmitHandler && formSubmitHandler()}
        isFormValid={formValid}
      />

      <Row>
        <Col lg={6}>
          <XRoadRequestForm
            onSubmit={handleSubmit}
            initialRequest={currentRequest}
            isFromHistory={isFromHistory}
            onRequestModified={handleRequestModified}
            onFormChange={handleFormChange}
          />
        </Col>
        <Col lg={6}>
          <XRoadResponseViewer response={response} />
        </Col>
      </Row>

      {/* History sidebar */}
      <HistoryList onView={handleView} onDelete={handleDelete} showAlert={showAlert} />
    </Container>
  );
};

export default XRoad;
