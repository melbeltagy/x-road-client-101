import React from 'react';
import { Alert } from 'reactstrap';
import { Translate } from 'app/shared/i18n';
import { XRoadResponse } from 'app/shared/model/xroad-response.model';
import { useTheme } from 'app/config/theme-context';
import { ResponseStatusSection } from './components/response-status-section';
import { CollapsibleHeadersSection } from './components/collapsible-headers-section';
import { ResponseXRoadErrorSection } from './components/response-xroad-error-section';
import { ResponseBodySection } from './components/response-body-section';
import './xroad-response-viewer.scss';

interface XRoadResponseViewerProps {
  response: XRoadResponse | null;
}

// Helper function to expand multi-value HTTP headers into multiple key-value pairs
// HTTP headers are string arrays - this expands them for display
const expandHeaders = (headers: Record<string, string[]>): Record<string, string> => {
  const expanded: Record<string, string> = {};

  Object.entries(headers).forEach(([key, values]) => {
    if (values.length === 0) {
      return; // Skip empty arrays
    }

    if (values.length === 1) {
      // Single value - display as-is
      expanded[key] = values[0];
    } else {
      // Multiple values - expand with index
      values.forEach((value, index) => {
        expanded[`${key}[${index}]`] = value;
      });
    }
  });

  return expanded;
};

export const XRoadResponseViewer: React.FC<XRoadResponseViewerProps> = ({ response }) => {
  const { effectiveTheme } = useTheme();

  // Early return if no response
  if (!response) {
    return (
      <Alert color="info">
        <Translate contentKey="xroad.response.noResponse">No response yet. Send a request to see the response here.</Translate>
      </Alert>
    );
  }

  return (
    <div className="xroad-response-viewer">
      {/* Response Status */}
      <ResponseStatusSection
        statusCode={response.statusCode}
        statusText={response.statusText}
        timestamp={response.timestamp}
        contentType={response.contentType}
        contentLength={response.contentLength}
      />

      {/* X-Road Headers */}
      <CollapsibleHeadersSection
        titleKey="xroad.response.xroadHeaders"
        defaultTitle="X-Road Headers"
        headers={{
          'X-Road-Id': response.xroadId || '',
          'X-Road-Request-Hash': response.xroadRequestHash || '',
          'X-Road-Request-Id': response.xroadRequestId || '',
        }}
        defaultOpen={true}
      />

      {/* X-Road Error */}
      <ResponseXRoadErrorSection xroadError={response.xroadError} />

      {/* All Headers */}
      <CollapsibleHeadersSection
        titleKey="xroad.response.allHeaders"
        defaultTitle="All Headers"
        headers={expandHeaders(response.headers || {})}
        defaultOpen={false}
        emptyMessageKey="xroad.response.noHeaders"
        defaultEmptyMessage="No headers"
      />

      {/* Response Body */}
      <ResponseBodySection body={response.body} contentType={response.contentType} effectiveTheme={effectiveTheme} />
    </div>
  );
};
