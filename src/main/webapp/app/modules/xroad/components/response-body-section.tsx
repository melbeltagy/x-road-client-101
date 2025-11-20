import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardBody, Collapse, Button, ButtonGroup, Badge, Alert } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { JsonView, allExpanded, defaultStyles, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface ResponseBodySectionProps {
  body?: string;
  contentType?: string;
  effectiveTheme: 'light' | 'dark';
}

type ViewMode = 'raw' | 'json';

const isBodyTooLarge = (body?: string): boolean => {
  if (!body) return false;
  const sizeInBytes = new Blob([body]).size;
  return sizeInBytes > 1024 * 1024; // 1MB limit
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const ResponseBodySection: React.FC<ResponseBodySectionProps> = ({ body, contentType, effectiveTheme }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('raw');

  // Use library's built-in theme styles
  const jsonViewStyles = useMemo(() => {
    return effectiveTheme === 'dark' ? darkStyles : defaultStyles;
  }, [effectiveTheme]);

  // JSON parsing and validation - always try to parse the entire body
  const parsedJson = useMemo(() => {
    if (!body || isBodyTooLarge(body)) return null;

    try {
      return JSON.parse(body);
    } catch {
      return null; // Invalid JSON
    }
  }, [body]);

  const isValidJson = parsedJson !== null;
  const bodySize = body ? new Blob([body]).size : 0;
  const bodyTooLarge = isBodyTooLarge(body);

  // Auto-select view mode based on JSON validity
  useEffect(() => {
    if (isValidJson && !bodyTooLarge) {
      setViewMode('json');
    } else {
      setViewMode('raw');
    }
  }, [body, isValidJson, bodyTooLarge]);

  const downloadResponse = () => {
    if (!body) return;
    const blob = new Blob([body], { type: contentType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xroad-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
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
              <Translate contentKey="xroad.response.responseBody">Response Body</Translate>
            </strong>
          </Button>
          <div className="d-flex align-items-center gap-2">
            {/* Format toggle buttons */}
            {body && !bodyTooLarge && isValidJson && (
              <ButtonGroup size="sm">
                <Button color={viewMode === 'raw' ? 'primary' : 'secondary'} onClick={() => setViewMode('raw')}>
                  <Translate contentKey="xroad.response.raw">Raw</Translate>
                </Button>
                <Button color={viewMode === 'json' ? 'primary' : 'secondary'} onClick={() => setViewMode('json')}>
                  <Translate contentKey="xroad.response.jsonFormat">JSON Format</Translate>
                </Button>
              </ButtonGroup>
            )}
            {body && (
              <small className="text-muted">
                <Translate contentKey="xroad.response.size">Size</Translate>: {formatBytes(bodySize)}
                {bodyTooLarge && (
                  <Badge color="warning" className="ms-2">
                    <Translate contentKey="xroad.response.tooLarge">Too Large</Translate>
                  </Badge>
                )}
              </small>
            )}
          </div>
        </div>
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>
          {!body ? (
            <em className="text-muted">
              <Translate contentKey="xroad.response.noBody">No body</Translate>
            </em>
          ) : bodyTooLarge ? (
            <div>
              <Alert color="warning">
                <Translate contentKey="xroad.response.bodyTooLargeMessage">
                  Response body is larger than 1MB and cannot be displayed inline.
                </Translate>
              </Alert>
              <button className="btn btn-primary btn-sm" onClick={downloadResponse}>
                <Translate contentKey="xroad.response.downloadResponse">Download Response</Translate>
              </button>
            </div>
          ) : viewMode === 'json' && isValidJson ? (
            /* JSON view with syntax highlighting and expandable sections */
            <div className="json-view-container">
              <JsonView data={parsedJson} shouldExpandNode={allExpanded} style={jsonViewStyles} />
            </div>
          ) : viewMode === 'json' && !isValidJson ? (
            /* Fallback message for invalid JSON */
            <div>
              <Alert color="warning" className="mb-3">
                <Translate contentKey="xroad.response.invalidJson">
                  Response body is not valid JSON. Displaying as raw text instead.
                </Translate>
              </Alert>
              <pre className="response-body-pre">{body}</pre>
            </div>
          ) : (
            /* Raw view */
            <pre className="response-body-pre">{body}</pre>
          )}
        </CardBody>
      </Collapse>
    </Card>
  );
};
