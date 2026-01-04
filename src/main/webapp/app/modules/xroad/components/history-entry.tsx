import React from 'react';
import { Badge, Button, ListGroupItem } from 'reactstrap';
import { Translate } from 'app/shared/i18n';
import { RequestHistoryEntry } from 'app/shared/reducers/xroad-history';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

interface HistoryEntryProps {
  entry: RequestHistoryEntry;
  isSelected: boolean;
  onView: (entry: RequestHistoryEntry) => void;
  onDelete: (entryId: string) => void;
}

export const HistoryEntry: React.FC<HistoryEntryProps> = ({ entry, isSelected, onView, onDelete }) => {
  const getStatusBadgeColor = (statusCode: number): string => {
    if (statusCode === 0) return 'danger';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'info';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    return 'danger';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getClientIdentifier = () => {
    const { client } = entry.request;
    const { instanceId, memberClass, memberCode, subsystemCode } = client.subsystem;
    return `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}`;
  };

  const getServiceUrl = () => {
    const { client, service, request } = entry.request;
    const { securityServerUrl } = client;
    const { instanceId, memberClass, memberCode, subsystemCode } = service.subsystem;
    const { serviceCode, serviceVersion } = service;

    const serviceId = serviceVersion
      ? `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}/${serviceCode}/${serviceVersion}`
      : `${instanceId}/${memberClass}/${memberCode}/${subsystemCode}/${serviceCode}`;

    return `${securityServerUrl}/r1/${serviceId}${request.path}`;
  };

  return (
    <ListGroupItem
      action
      active={isSelected}
      onClick={() => onView(entry)}
      className="d-flex justify-content-between align-items-start"
      style={{ cursor: 'pointer' }}
    >
      <div className="flex-grow-1">
        <div className="fw-bold mb-1">
          <small className="text-muted">Client:</small> {getClientIdentifier()}
        </div>
        <div className="mb-1">
          <small className="text-muted">Method:</small> <span className="fw-bold">{entry.request.request.method}</span>
        </div>
        <div className="small text-muted mb-2">
          <FontAwesomeIcon icon={faClock} className="me-1" />
          {formatTimestamp(entry.timestamp)}
        </div>
        <div className="small text-break mb-2" style={{ fontFamily: 'monospace' }}>
          {getServiceUrl()}
        </div>
        {entry.response && (
          <Badge color={getStatusBadgeColor(entry.response.statusCode)}>
            <Translate contentKey="xroad.history.entry.status">Status</Translate>: {entry.response.statusCode} {entry.response.statusText}
          </Badge>
        )}
      </div>
      <Button
        color="link"
        className="text-danger p-0 ms-2"
        onClick={e => {
          e.stopPropagation();
          onDelete(entry.id);
        }}
        title="Delete"
      >
        <FontAwesomeIcon icon="trash" />
      </Button>
    </ListGroupItem>
  );
};
