import React from 'react';
import { Button, Card, CardBody, CardHeader, Collapse } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { UseFormRegister } from 'react-hook-form';
import { Translate } from 'app/shared/i18n';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { KeyValuePair, KeyValuePairList } from './key-value-pair-list';
import { XRoadHeaderFields } from './xroad-header-fields';

interface AdvancedSectionProps {
  register: UseFormRegister<XRoadRequest>;
  queryParams: KeyValuePair[];
  customHeaders: KeyValuePair[];
  onAddQueryParam: () => void;
  onRemoveQueryParam: (index: number) => void;
  onUpdateQueryParam: (index: number, field: 'key' | 'value', value: string) => void;
  onAddCustomHeader: () => void;
  onRemoveCustomHeader: (index: number) => void;
  onUpdateCustomHeader: (index: number, field: 'key' | 'value', value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  register,
  queryParams,
  customHeaders,
  onAddQueryParam,
  onRemoveQueryParam,
  onUpdateQueryParam,
  onAddCustomHeader,
  onRemoveCustomHeader,
  onUpdateCustomHeader,
  isOpen,
  onToggle,
}) => {
  return (
    <Card className="mb-3">
      <CardHeader>
        <Button color="link" onClick={onToggle} type="button" className="p-0 text-start w-100" style={{ textDecoration: 'none' }}>
          <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{' '}
          <strong>
            <Translate contentKey="xroad.advanced.title">Advanced Configuration</Translate>
          </strong>
        </Button>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>
          {/* T069: Query Parameters */}
          <KeyValuePairList
            titleKey="xroad.advanced.queryParams"
            titleDefault="Query Parameters"
            items={queryParams}
            keyPlaceholderKey="xroad.advanced.key"
            valuePlaceholderKey="xroad.advanced.value"
            emptyMessageKey="xroad.advanced.noQueryParams"
            emptyMessageDefault="No query parameters. Click Add to include query parameters."
            onAdd={onAddQueryParam}
            onRemove={onRemoveQueryParam}
            onUpdate={onUpdateQueryParam}
          />

          {/* T070: Custom Headers */}
          <KeyValuePairList
            titleKey="xroad.advanced.customHeaders"
            titleDefault="Custom HTTP Headers"
            items={customHeaders}
            keyPlaceholderKey="xroad.advanced.headerName"
            valuePlaceholderKey="xroad.advanced.headerValue"
            emptyMessageKey="xroad.advanced.noCustomHeaders"
            emptyMessageDefault="No custom headers. Click Add to include additional HTTP headers."
            onAdd={onAddCustomHeader}
            onRemove={onRemoveCustomHeader}
            onUpdate={onUpdateCustomHeader}
          />

          {/* T071: Optional X-Road Headers */}
          <XRoadHeaderFields register={register} />
        </CardBody>
      </Collapse>
    </Card>
  );
};
