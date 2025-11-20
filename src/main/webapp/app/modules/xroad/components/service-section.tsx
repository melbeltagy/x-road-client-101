import React from 'react';
import { Card, CardHeader, CardBody, FormGroup, Label, Button, Row, Col, Collapse } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Translate, translate } from 'react-jhipster';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { SubsystemIdFields } from './subsystem-id-fields';
import { CircularIconButton } from './circular-icon-button';

interface ServiceSectionProps {
  register: UseFormRegister<XRoadRequest>;
  errors: FieldErrors<XRoadRequest>;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ServiceSection: React.FC<ServiceSectionProps> = ({ register, errors, onClear, isOpen, onToggle }) => {
  return (
    <Card className="mb-3">
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <Button color="link" onClick={onToggle} type="button" className="p-0 text-start flex-grow-1" style={{ textDecoration: 'none' }}>
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{' '}
            <strong>
              <Translate contentKey="xroad.service.title">Service Identifier</Translate>
            </strong>
          </Button>
          <CircularIconButton icon={faTrash} color="danger" onClick={onClear} title={translate('xroad.service.clear')} />
        </div>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>
          <SubsystemIdFields prefix="service" register={register} errors={errors} idPrefix="service" />
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="serviceCode">
                  <Translate contentKey="xroad.service.serviceCode">Service Code</Translate> *
                </Label>
                <input
                  id="serviceCode"
                  type="text"
                  className={`form-control ${errors.service?.serviceCode ? 'is-invalid' : ''}`}
                  {...register('service.serviceCode', {
                    required: translate('xroad.validation.required'),
                    pattern: {
                      value: /^[A-Za-z0-9_-]+$/,
                      message: translate('xroad.validation.serviceCode'),
                    },
                  })}
                  placeholder={translate('xroad.placeholders.serviceCode')}
                />
                {errors.service?.serviceCode && <div className="invalid-feedback d-block">{errors.service?.serviceCode?.message}</div>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="serviceVersion">
                  <Translate contentKey="xroad.service.serviceVersion">Service Version</Translate>
                </Label>
                <input
                  id="serviceVersion"
                  type="text"
                  className={`form-control ${errors.service?.serviceVersion ? 'is-invalid' : ''}`}
                  {...register('service.serviceVersion', {
                    pattern: {
                      value: /^v?[0-9]+(\.[0-9]+)*$/,
                      message: translate('xroad.validation.serviceVersion'),
                    },
                  })}
                  placeholder={translate('xroad.placeholders.serviceVersion')}
                />
                {errors.service?.serviceVersion && (
                  <div className="invalid-feedback d-block">{errors.service?.serviceVersion?.message}</div>
                )}
              </FormGroup>
            </Col>
          </Row>
        </CardBody>
      </Collapse>
    </Card>
  );
};
