import React from 'react';
import { Button, Col, FormGroup, FormText, Input, Label, Row } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Translate, translate } from 'app/shared/i18n';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface KeyValuePairListProps {
  titleKey: string;
  titleDefault: string;
  items: KeyValuePair[];
  keyPlaceholderKey: string;
  valuePlaceholderKey: string;
  emptyMessageKey: string;
  emptyMessageDefault: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: 'key' | 'value', value: string) => void;
}

export const KeyValuePairList: React.FC<KeyValuePairListProps> = ({
  titleKey,
  titleDefault,
  items,
  keyPlaceholderKey,
  valuePlaceholderKey,
  emptyMessageKey,
  emptyMessageDefault,
  onAdd,
  onRemove,
  onUpdate,
}) => (
  <FormGroup>
    <div className="d-flex justify-content-between align-items-center mb-2">
      <Label className="mb-0">
        <Translate contentKey={titleKey}>{titleDefault}</Translate>
      </Label>
      <Button size="sm" color="primary" outline onClick={onAdd} type="button">
        <FontAwesomeIcon icon={faPlus} /> <Translate contentKey="xroad.advanced.add">Add</Translate>
      </Button>
    </div>
    {items.length === 0 && (
      <FormText color="muted">
        <Translate contentKey={emptyMessageKey}>{emptyMessageDefault}</Translate>
      </FormText>
    )}
    {items.map((item, index) => (
      <Row key={item.id} className="mb-2">
        <Col md={5}>
          <Input
            type="text"
            placeholder={translate(keyPlaceholderKey)}
            value={item.key}
            onChange={e => onUpdate(index, 'key', e.target.value)}
          />
        </Col>
        <Col md={5}>
          <Input
            type="text"
            placeholder={translate(valuePlaceholderKey)}
            value={item.value}
            onChange={e => onUpdate(index, 'value', e.target.value)}
          />
        </Col>
        <Col md={2}>
          <Button size="sm" color="danger" outline onClick={() => onRemove(index)} type="button" block>
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </Col>
      </Row>
    ))}
  </FormGroup>
);
