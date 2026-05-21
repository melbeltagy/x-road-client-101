import React from 'react';
import { Button, Card, CardBody, Col, Row } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCheckCircle, faCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Translate } from 'app/shared/i18n';
import { MTlsCertificates } from 'app/shared/model/mtls-certificates.model';

interface RequestStatusPanelProps {
  client: {
    subsystem: {
      instanceId?: string;
      memberClass?: string;
      memberCode?: string;
      subsystemCode?: string;
    };
    securityServerUrl?: string;
  };
  service: {
    subsystem: {
      instanceId?: string;
      memberClass?: string;
      memberCode?: string;
      subsystemCode?: string;
    };
    serviceCode?: string;
    serviceVersion?: string;
  };
  requestPath?: string;
  certificates: MTlsCertificates;
  lastRequestSuccess: boolean | null; // null = not sent yet, true = success, false = error
  loading: boolean;
  onSubmit: () => void;
  isFormValid: boolean;
}

export const RequestStatusPanel: React.FC<RequestStatusPanelProps> = ({
  client,
  service,
  requestPath,
  certificates,
  lastRequestSuccess,
  loading,
  onSubmit,
  isFormValid,
}) => {
  // Build X-Road-Client header value
  const buildClientHeader = () => {
    const { instanceId, memberClass, memberCode, subsystemCode } = client.subsystem;
    if (!instanceId || !memberClass || !memberCode || !subsystemCode) {
      return <span className="text-muted">Not configured</span>;
    }
    return `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}`;
  };

  // Build Service URL
  const buildServiceUrl = () => {
    const { securityServerUrl } = client;
    const { instanceId, memberClass, memberCode, subsystemCode } = service.subsystem;
    const { serviceCode, serviceVersion } = service;

    if (!securityServerUrl || !instanceId || !memberClass || !memberCode || !subsystemCode || !serviceCode || !requestPath) {
      return <span className="text-muted">Not configured</span>;
    }

    const serviceId = serviceVersion
      ? `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}/${serviceCode}/${serviceVersion}`
      : `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}/${serviceCode}`;

    return `${securityServerUrl}/r1/${serviceId}${requestPath}`;
  };

  // Check mTLS status (all 3 certificates required)
  const hasMtls = !!(
    certificates.securityServerCert &&
    certificates.clientCert &&
    certificates.clientPrivateKey &&
    certificates.securityServerCert.trim() !== '' &&
    certificates.clientCert.trim() !== '' &&
    certificates.clientPrivateKey.trim() !== ''
  );

  // Check HTTPS no-auth status (only security server cert required)
  const hasHttpsNoAuth = !!(certificates.securityServerCert && certificates.securityServerCert.trim() !== '');

  // Status indicator component
  const StatusIndicator = ({ status, trueLabel, falseLabel }: { status: boolean; trueLabel: string; falseLabel: string }) => (
    <div className="d-flex align-items-center">
      <FontAwesomeIcon icon={status ? faCheckCircle : faBan} size="2x" className={status ? 'text-success me-2' : 'text-danger me-2'} />
      <span className="fs-5">{status ? trueLabel : falseLabel}</span>
    </div>
  );

  // Request status indicator
  const RequestStatusIndicator = () => {
    if (lastRequestSuccess === null) {
      return (
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faCircle} size="2x" className="text-muted me-2" />
          <span className="fs-5 text-muted">
            <Translate contentKey="xroad.status.notSent">Not sent</Translate>
          </span>
        </div>
      );
    }
    return (
      <div className="d-flex align-items-center">
        <FontAwesomeIcon
          icon={lastRequestSuccess ? faCheckCircle : faBan}
          size="2x"
          className={lastRequestSuccess ? 'text-success me-2' : 'text-danger me-2'}
        />
        <span className="fs-5">
          {lastRequestSuccess ? (
            <Translate contentKey="xroad.status.success">Request successful</Translate>
          ) : (
            <Translate contentKey="xroad.status.error">Request failed</Translate>
          )}
        </span>
      </div>
    );
  };

  return (
    <Card className="shadow-sm border-primary" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
      <CardBody className="p-4">
        {/* Client Header */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center">
              <strong className="fs-5 me-3" style={{ minWidth: '150px' }}>
                <Translate contentKey="xroad.status.client">Client:</Translate>
              </strong>
              <span className="fs-4 font-monospace">{buildClientHeader()}</span>
            </div>
          </Col>
        </Row>

        {/* Service URL */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center">
              <strong className="fs-5 me-3" style={{ minWidth: '150px' }}>
                <Translate contentKey="xroad.status.serviceUrl">Service URL:</Translate>
              </strong>
              <span className="fs-4 font-monospace text-break">{buildServiceUrl()}</span>
            </div>
          </Col>
        </Row>

        {/* Indicators and Send Button */}
        <Row>
          <Col lg={3} md={6} className="mb-3 mb-lg-0">
            <StatusIndicator status={hasMtls} trueLabel="mTLS Enabled" falseLabel="mTLS Disabled" />
          </Col>
          <Col lg={3} md={6} className="mb-3 mb-lg-0">
            <StatusIndicator status={hasHttpsNoAuth} trueLabel="HTTPS (No Auth)" falseLabel="No HTTPS Cert" />
          </Col>
          <Col lg={3} md={6} className="mb-3 mb-lg-0">
            <RequestStatusIndicator />
          </Col>
          <Col lg={3} md={6} className="d-flex align-items-center justify-content-end">
            <Button color="primary" size="lg" onClick={onSubmit} disabled={loading || !isFormValid} className="w-100">
              {loading && <FontAwesomeIcon icon={faSpinner} spin size="2x" className="me-2" />}
              {loading ? (
                <Translate contentKey="xroad.request.sending">Sending...</Translate>
              ) : (
                <Translate contentKey="xroad.request.submit">Send Request</Translate>
              )}
            </Button>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};
