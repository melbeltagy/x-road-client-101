import React, { DragEvent, useEffect, useRef, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { Translate } from 'app/shared/i18n';
import { CertificateType } from 'app/shared/model/mtls-certificates.model';
import './certificate-upload-modal.scss';

interface CertificateUploadModalProps {
  isOpen: boolean;
  toggle: () => void;
  certificateType: CertificateType;
  certificateLabel: string;
  certificateDescription: string;
  currentValue?: string;
  onSave: (value: string) => void;
}

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  toggle,
  certificateType,
  certificateLabel,
  certificateDescription,
  currentValue,
  onSave,
}) => {
  const [certificateContent, setCertificateContent] = useState<string>(currentValue || '');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update certificate content when currentValue or certificateType changes
  useEffect(() => {
    setCertificateContent(currentValue || '');
  }, [currentValue, certificateType]);

  const handleSave = () => {
    onSave(certificateContent.trim());
    toggle();
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      setCertificateContent(content);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setCertificateContent('');
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" className="certificate-upload-modal">
      <ModalHeader toggle={toggle}>
        <Translate contentKey={`xroad.certificates.modal.title.${certificateType}`}>{certificateLabel}</Translate>
      </ModalHeader>
      <ModalBody>
        <p className="text-muted">
          <Translate contentKey={`xroad.certificates.modal.description.${certificateType}`}>{certificateDescription}</Translate>
        </p>

        {/* Upload Section */}
        <FormGroup>
          <Label>
            <Translate contentKey="xroad.certificates.modal.upload">Upload Certificate</Translate>
          </Label>
          <div
            className={`border rounded p-4 text-center certificate-dropzone ${isDragging ? 'border-primary bg-light' : 'border-secondary'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pem,.crt,.key,.cert"
              className="certificate-file-input"
              onChange={handleFileInputChange}
            />
            <div>
              {isDragging ? (
                <p className="text-primary mb-0">
                  <Translate contentKey="xroad.certificates.modal.dropHere">Drop file here...</Translate>
                </p>
              ) : (
                <>
                  <p className="mb-2">
                    <Translate contentKey="xroad.certificates.modal.dragDrop">Drag and drop file here</Translate>
                  </p>
                  <Button color="secondary" size="sm" onClick={handleBrowseClick}>
                    <Translate contentKey="xroad.certificates.modal.browse">Browse Files</Translate>
                  </Button>
                </>
              )}
            </div>
          </div>
        </FormGroup>

        {/* Manual Entry Section */}
        <FormGroup>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Label className="mb-0">
              <Translate contentKey="xroad.certificates.modal.manualEntry">Certificate Content (PEM Format)</Translate>
            </Label>
            {certificateContent && (
              <Button color="link" size="sm" onClick={handleClear} className="text-danger">
                <Translate contentKey="xroad.certificates.modal.clear">Clear</Translate>
              </Button>
            )}
          </div>
          <Input
            type="textarea"
            rows={12}
            value={certificateContent}
            onChange={e => setCertificateContent(e.target.value)}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            className="font-monospace certificate-textarea"
          />
          <FormText color="muted">
            <Translate contentKey="xroad.certificates.modal.pemFormat">
              Paste PEM-formatted certificate content or use upload above
            </Translate>
          </FormText>
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button color="primary" onClick={handleSave} disabled={!certificateContent.trim()}>
          <Translate contentKey="entity.action.save">Save</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};
