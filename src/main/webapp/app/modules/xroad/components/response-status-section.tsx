import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Collapse, Button, Badge } from 'reactstrap';
import { Translate, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface ResponseStatusSectionProps {
  statusCode: number;
  statusText: string;
  timestamp: string;
  contentType?: string;
  contentLength?: number | null;
}

const getStatusColor = (statusCode: number): string => {
  if (statusCode === 0) return 'danger'; // Client error
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 300 && statusCode < 400) return 'info';
  if (statusCode >= 400 && statusCode < 500) return 'warning';
  return 'danger';
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const ResponseStatusSection: React.FC<ResponseStatusSectionProps> = ({
  statusCode,
  statusText,
  timestamp,
  contentType,
  contentLength,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="mb-3">
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <Button
            color="link"
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="p-0 text-start flex-grow-1"
            style={{ textDecoration: 'none' }}
          >
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} />{' '}
            <strong>
              <Translate contentKey="xroad.response.responseStatus">Response Status</Translate>
            </strong>
            <Badge color={getStatusColor(statusCode)} className="ms-2">
              {statusCode === 0 ? translate('xroad.response.error') : `${statusCode} ${statusText}`}
            </Badge>
          </Button>
        </div>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>
          <div className="mb-2">
            <small className="text-muted">
              <Translate contentKey="xroad.response.timestamp">Timestamp</Translate>:
            </small>{' '}
            {new Date(timestamp).toLocaleString()}
          </div>
          {contentType && (
            <div className="mb-2">
              <small className="text-muted">
                <Translate contentKey="xroad.response.contentType">Content-Type</Translate>:
              </small>{' '}
              {contentType}
            </div>
          )}
          {contentLength != null && (
            <div className="mb-2">
              <small className="text-muted">
                <Translate contentKey="xroad.response.contentLength">Content-Length</Translate>:
              </small>{' '}
              {formatBytes(contentLength)}
            </div>
          )}
        </CardBody>
      </Collapse>
    </Card>
  );
};
