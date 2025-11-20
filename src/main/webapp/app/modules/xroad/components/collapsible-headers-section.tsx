import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Collapse, Button } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleHeadersSectionProps {
  titleKey: string;
  defaultTitle: string;
  headers: Record<string, string>;
  defaultOpen?: boolean;
  emptyMessageKey?: string;
  defaultEmptyMessage?: string;
}

export const CollapsibleHeadersSection: React.FC<CollapsibleHeadersSectionProps> = ({
  titleKey,
  defaultTitle,
  headers,
  defaultOpen = false,
  emptyMessageKey,
  defaultEmptyMessage,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Filter out empty values and check if we have any headers
  const validHeaders = Object.entries(headers).filter(([, value]) => value && value.trim() !== '');

  // Don't render if no headers exist
  if (validHeaders.length === 0) {
    return null;
  }

  return (
    <Card className="mb-3">
      <CardHeader>
        <Button
          color="link"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="p-0 text-start w-100"
          style={{ textDecoration: 'none' }}
        >
          <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{' '}
          <strong>
            <Translate contentKey={titleKey}>{defaultTitle}</Translate>
          </strong>
        </Button>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>
          {validHeaders.length === 0 ? (
            emptyMessageKey && defaultEmptyMessage ? (
              <em className="text-muted">
                <Translate contentKey={emptyMessageKey}>{defaultEmptyMessage}</Translate>
              </em>
            ) : null
          ) : (
            <>
              {validHeaders.map(([key, value]) => (
                <div key={key} className="mb-2">
                  <small className="text-muted">{key}:</small> <code>{value}</code>
                </div>
              ))}
            </>
          )}
        </CardBody>
      </Collapse>
    </Card>
  );
};
