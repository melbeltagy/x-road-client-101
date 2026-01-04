import React from 'react';
import { FormGroup, Label, Row, Col } from 'reactstrap';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Translate, translate } from 'app/shared/i18n';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';

interface SubsystemIdFieldsProps {
  prefix: 'client' | 'service';
  register: UseFormRegister<XRoadRequest>;
  errors: FieldErrors<XRoadRequest>;
  idPrefix?: string;
}

export const SubsystemIdFields: React.FC<SubsystemIdFieldsProps> = ({ prefix, register, errors, idPrefix = '' }) => {
  const subsystemErrors = errors[prefix]?.subsystem;

  return (
    <>
      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for={`${idPrefix}instanceId`}>
              <Translate contentKey={`xroad.${prefix}.instanceId`}>Instance ID</Translate> *
            </Label>
            <input
              id={`${idPrefix}instanceId`}
              type="text"
              className={`form-control ${subsystemErrors?.instanceId ? 'is-invalid' : ''}`}
              {...register(`${prefix}.subsystem.instanceId`, {
                required: translate('xroad.validation.required'),
                pattern: {
                  value: /^[A-Za-z0-9-]{2,}$/,
                  message: translate('xroad.validation.instanceId'),
                },
              })}
              placeholder={translate('xroad.placeholders.instanceId')}
            />
            {subsystemErrors?.instanceId && <div className="invalid-feedback d-block">{subsystemErrors.instanceId.message}</div>}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for={`${idPrefix}memberClass`}>
              <Translate contentKey={`xroad.${prefix}.memberClass`}>Member Class</Translate> *
            </Label>
            <input
              id={`${idPrefix}memberClass`}
              type="text"
              className={`form-control ${subsystemErrors?.memberClass ? 'is-invalid' : ''}`}
              {...register(`${prefix}.subsystem.memberClass`, {
                required: translate('xroad.validation.required'),
                pattern: {
                  value: /^[A-Za-z0-9-]+$/,
                  message: translate('xroad.validation.memberClass'),
                },
              })}
              placeholder={translate('xroad.placeholders.memberClass')}
            />
            {subsystemErrors?.memberClass && <div className="invalid-feedback d-block">{subsystemErrors.memberClass.message}</div>}
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for={`${idPrefix}memberCode`}>
              <Translate contentKey={`xroad.${prefix}.memberCode`}>Member Code</Translate> *
            </Label>
            <input
              id={`${idPrefix}memberCode`}
              type="text"
              className={`form-control ${subsystemErrors?.memberCode ? 'is-invalid' : ''}`}
              {...register(`${prefix}.subsystem.memberCode`, {
                required: translate('xroad.validation.required'),
                pattern: {
                  value: /^[A-Za-z0-9-]+$/,
                  message: translate('xroad.validation.memberCode'),
                },
              })}
              placeholder={
                prefix === 'service' ? translate('xroad.placeholders.serviceMemberCode') : translate('xroad.placeholders.memberCode')
              }
            />
            {subsystemErrors?.memberCode && <div className="invalid-feedback d-block">{subsystemErrors.memberCode.message}</div>}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for={`${idPrefix}subsystemCode`}>
              <Translate contentKey={`xroad.${prefix}.subsystemCode`}>Subsystem Code</Translate> *
            </Label>
            <input
              id={`${idPrefix}subsystemCode`}
              type="text"
              className={`form-control ${subsystemErrors?.subsystemCode ? 'is-invalid' : ''}`}
              {...register(`${prefix}.subsystem.subsystemCode`, {
                required: translate('xroad.validation.required'),
                pattern: {
                  value: /^[A-Za-z0-9-]+$/,
                  message: translate('xroad.validation.subsystemCode'),
                },
              })}
              placeholder={
                prefix === 'service' ? translate('xroad.placeholders.serviceSubsystemCode') : translate('xroad.placeholders.subsystemCode')
              }
            />
            {subsystemErrors?.subsystemCode && <div className="invalid-feedback d-block">{subsystemErrors.subsystemCode.message}</div>}
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};
