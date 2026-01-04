import React from 'react';
import { FormGroup, Label, Input, Row, Col, FormText } from 'reactstrap';
import { UseFormRegister } from 'react-hook-form';
import { Translate } from 'app/shared/i18n';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';

interface XRoadHeaderFieldsProps {
  register: UseFormRegister<XRoadRequest>;
}

export const XRoadHeaderFields: React.FC<XRoadHeaderFieldsProps> = ({ register }) => {
  return (
    <FormGroup>
      <Label>
        <Translate contentKey="xroad.advanced.xroadHeaders">Optional X-Road Headers</Translate>
      </Label>
      <FormText color="muted" className="d-block mb-2">
        <Translate contentKey="xroad.advanced.xroadHeadersHelp">
          Optional X-Road protocol headers for advanced use cases. Leave empty if not required.
        </Translate>
      </FormText>
      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for="xroadId" className="small">
              X-Road-Id
            </Label>
            <Input type="text" id="xroadId" {...register('request.xroadId')} placeholder="Unique request identifier" />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="xroadUserId" className="small">
              X-Road-UserId
            </Label>
            <Input type="text" id="xroadUserId" {...register('request.xroadUserId')} placeholder="User identifier" />
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for="xroadIssue" className="small">
              X-Road-Issue
            </Label>
            <Input type="text" id="xroadIssue" {...register('request.xroadIssue')} placeholder="Issue identifier" />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="xroadRepresentedParty" className="small">
              X-Road-Represented-Party
            </Label>
            <Input
              type="text"
              id="xroadRepresentedParty"
              {...register('request.xroadRepresentedParty')}
              placeholder="Represented party identifier"
            />
          </FormGroup>
        </Col>
      </Row>
    </FormGroup>
  );
};
