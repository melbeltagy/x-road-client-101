import React from 'react';
import { Card, CardHeader, CardBody, FormGroup, Label, Button, Row, Col, Input, FormText, Collapse } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Translate, translate } from 'app/shared/i18n';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { CircularIconButton } from './circular-icon-button';

interface RequestSectionProps {
  register: UseFormRegister<XRoadRequest>;
  errors: FieldErrors<XRoadRequest>;
  onClear: () => void;
  requestBody: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const RequestSection: React.FC<RequestSectionProps> = ({ register, errors, onClear, requestBody, isOpen, onToggle }) => {
  return (
    <Card className="mb-3">
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <Button color="link" onClick={onToggle} type="button" className="p-0 text-start flex-grow-1" style={{ textDecoration: 'none' }}>
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{' '}
            <strong>
              <Translate contentKey="xroad.request.title">Request Details</Translate>
            </strong>
          </Button>
          <CircularIconButton icon={faTrash} color="danger" onClick={onClear} title={translate('xroad.request.clear')} />
        </div>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="method">
                  <Translate contentKey="xroad.request.method">HTTP Method</Translate> *
                </Label>
                <select
                  id="method"
                  className={`form-select ${errors.request?.method ? 'is-invalid' : ''}`}
                  {...register('request.method', { required: translate('xroad.validation.method') })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                {errors.request?.method && <div className="invalid-feedback d-block">{errors.request?.method?.message}</div>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="path">
                  <Translate contentKey="xroad.request.path">Path</Translate> *
                </Label>
                <input
                  id="path"
                  type="text"
                  className={`form-control ${errors.request?.path ? 'is-invalid' : ''}`}
                  {...register('request.path', {
                    required: translate('xroad.validation.required'),
                    pattern: {
                      value: /^\/[A-Za-z0-9/_-]*$/,
                      message: translate('xroad.validation.path'),
                    },
                  })}
                  placeholder={translate('xroad.placeholders.path')}
                />
                {errors.request?.path && <div className="invalid-feedback d-block">{errors.request?.path?.message}</div>}
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label for="body">
              <Translate contentKey="xroad.request.body">Request Body</Translate>
            </Label>
            <Input
              type="textarea"
              id="body"
              rows={4}
              {...register('request.body')}
              placeholder={translate('xroad.request.bodyPlaceholder')}
            />
          </FormGroup>

          {/* T073: Content-Type field shown when body is present */}
          <FormGroup style={{ display: requestBody && requestBody.trim() !== '' ? 'block' : 'none' }}>
            <Label for="contentType">
              <Translate contentKey="xroad.request.contentType">Content-Type</Translate>
            </Label>
            <Input
              type="text"
              id="contentType"
              {...register('request.contentType')}
              placeholder={translate('xroad.request.contentTypePlaceholder')}
            />
            <FormText color="muted">
              <Translate contentKey="xroad.request.contentTypeHelp">
                Optional: Specify the Content-Type header for the request body (e.g., application/json, application/xml)
              </Translate>
            </FormText>
          </FormGroup>
        </CardBody>
      </Collapse>
    </Card>
  );
};
