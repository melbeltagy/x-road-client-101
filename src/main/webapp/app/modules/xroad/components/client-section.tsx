import React from 'react';
import { Button, Card, CardBody, CardHeader, Collapse, FormGroup, Label } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Translate, translate } from 'app/shared/i18n';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { SubsystemIdFields } from './subsystem-id-fields';
import { CircularIconButton } from './circular-icon-button';

interface ClientSectionProps {
  register: UseFormRegister<XRoadRequest>;
  errors: FieldErrors<XRoadRequest>;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ClientSection: React.FC<ClientSectionProps> = ({ register, errors, onClear, isOpen, onToggle }) => {
  return (
    <Card className="mb-3">
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <Button color="link" onClick={onToggle} type="button" className="p-0 text-start flex-grow-1" style={{ textDecoration: 'none' }}>
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{' '}
            <strong>
              <Translate contentKey="xroad.client.title">Client Identifier</Translate>
            </strong>
          </Button>
          <CircularIconButton icon={faTrash} color="danger" onClick={onClear} title={translate('xroad.client.clear')} />
        </div>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>
          <SubsystemIdFields prefix="client" register={register} errors={errors} />
          <FormGroup>
            <Label for="securityServerUrl">
              <Translate contentKey="xroad.client.securityServerUrl">Security Server URL</Translate> *
            </Label>
            <input
              id="securityServerUrl"
              type="text"
              className={`form-control ${errors.client?.securityServerUrl ? 'is-invalid' : ''}`}
              {...register('client.securityServerUrl', {
                required: translate('xroad.validation.required'),
                validate: {
                  validUrl(value: string) {
                    // Use browser's URL constructor for RFC 3986 compliant validation
                    try {
                      const url = new URL(value);

                      // Must be http or https
                      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                        return translate('xroad.validation.securityServerUrlProtocol');
                      }

                      // Hostname cannot contain underscores (RFC 952/1123)
                      if (url.hostname.includes('_')) {
                        return translate('xroad.validation.securityServerUrlUnderscore');
                      }

                      // Hostname cannot be empty
                      if (!url.hostname) {
                        return translate('xroad.validation.securityServerUrlHostname');
                      }

                      return true;
                    } catch {
                      return translate('xroad.validation.securityServerUrl');
                    }
                  },
                },
              })}
              placeholder={translate('xroad.placeholders.securityServerUrl')}
            />
            {errors.client?.securityServerUrl && (
              <div className="invalid-feedback d-block">{errors.client?.securityServerUrl?.message}</div>
            )}
          </FormGroup>
        </CardBody>
      </Collapse>
    </Card>
  );
};
