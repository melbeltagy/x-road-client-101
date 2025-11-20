import React, { useState } from 'react';
import { FormGroup, Button, Collapse, Card, CardBody, CardHeader, ListGroup, ListGroupItem, FormText } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faPlus, faEye, faTrash, faCheckCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { Translate, translate } from 'react-jhipster';
import { CertificateType, MTlsCertificates } from 'app/shared/model/mtls-certificates.model';
import { CertificateUploadModal } from './certificate-upload-modal';
import { CircularIconButton } from './circular-icon-button';

interface CertificateSectionProps {
  certificates: MTlsCertificates;
  onCertificateUpdate: (type: CertificateType, value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const certificateMetadata = [
  {
    type: CertificateType.SECURITY_SERVER,
    labelKey: 'xroad.certificates.securityServerCert',
    descriptionKey: 'xroad.certificates.securityServerCertDescription',
  },
  {
    type: CertificateType.CLIENT_CERT,
    labelKey: 'xroad.certificates.clientCert',
    descriptionKey: 'xroad.certificates.clientCertDescription',
  },
  {
    type: CertificateType.CLIENT_KEY,
    labelKey: 'xroad.certificates.clientPrivateKey',
    descriptionKey: 'xroad.certificates.clientPrivateKeyDescription',
  },
];

export const CertificateSection: React.FC<CertificateSectionProps> = ({ certificates, onCertificateUpdate, isOpen, onToggle }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    certificateType: CertificateType | null;
    certificateLabel: string;
    certificateDescription: string;
    currentValue?: string;
  }>({
    isOpen: false,
    certificateType: null,
    certificateLabel: '',
    certificateDescription: '',
    currentValue: '',
  });

  const openModal = (type: CertificateType, label: string, description: string, currentValue?: string) => {
    setModalState({
      isOpen: true,
      certificateType: type,
      certificateLabel: label,
      certificateDescription: description,
      currentValue: currentValue || '',
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      certificateType: null,
      certificateLabel: '',
      certificateDescription: '',
      currentValue: '',
    });
  };

  const handleCertificateSave = (value: string) => {
    if (modalState.certificateType) {
      onCertificateUpdate(modalState.certificateType, value);
    }
  };

  const handleCertificateDelete = (type: CertificateType) => {
    onCertificateUpdate(type, '');
  };

  const getCertificateValue = (type: CertificateType): string | undefined => {
    // Use the enum value which maps to the actual property name
    return certificates[type];
  };

  return (
    <>
      <FormGroup>
        <Card className="mb-3">
          <CardHeader>
            <Button color="link" onClick={onToggle} type="button" className="p-0 text-start w-100" style={{ textDecoration: 'none' }}>
              <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{' '}
              <strong>
                <Translate contentKey="xroad.certificates.title">mTLS Certificates (Optional)</Translate>
              </strong>
            </Button>
          </CardHeader>
          <Collapse isOpen={isOpen}>
            <CardBody>
              <FormText color="muted" className="mb-3 d-block">
                <Translate contentKey="xroad.certificates.description">
                  Configure mTLS certificates for secure communication with the X-Road Security Server
                </Translate>
              </FormText>

              <ListGroup>
                {certificateMetadata.map(cert => {
                  const certValue = getCertificateValue(cert.type);
                  const isConfigured = !!certValue;
                  const label = translate(cert.labelKey);
                  const description = translate(cert.descriptionKey);

                  return (
                    <ListGroupItem key={cert.type} className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <div className="fw-bold">{label}</div>
                        <small className="text-muted">{description}</small>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <FontAwesomeIcon
                          icon={isConfigured ? faCheckCircle : faCircle}
                          size="2x"
                          className={isConfigured ? 'text-success' : 'text-muted'}
                        />
                        {isConfigured && (
                          <>
                            <CircularIconButton
                              icon={faEye}
                              color="info"
                              onClick={() => openModal(cert.type, label, description, certValue)}
                              title="View/Edit"
                            />
                            <CircularIconButton
                              icon={faTrash}
                              color="danger"
                              onClick={() => handleCertificateDelete(cert.type)}
                              title="Delete"
                            />
                          </>
                        )}
                        {!isConfigured && (
                          <CircularIconButton
                            icon={faPlus}
                            color="primary"
                            onClick={() => openModal(cert.type, label, description)}
                            title={translate('xroad.certificates.add')}
                          />
                        )}
                      </div>
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
            </CardBody>
          </Collapse>
        </Card>
      </FormGroup>

      {modalState.certificateType && (
        <CertificateUploadModal
          isOpen={modalState.isOpen}
          toggle={closeModal}
          certificateType={modalState.certificateType}
          certificateLabel={modalState.certificateLabel}
          certificateDescription={modalState.certificateDescription}
          currentValue={modalState.currentValue}
          onSave={handleCertificateSave}
        />
      )}
    </>
  );
};
