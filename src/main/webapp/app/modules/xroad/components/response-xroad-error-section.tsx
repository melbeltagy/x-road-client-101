import React from 'react';
import { Alert } from 'reactstrap';
import { Translate } from 'app/shared/i18n';

interface XRoadError {
  type: string;
  message: string;
  detail?: string;
  faultCode?: string;
  faultString?: string;
}

interface ResponseXRoadErrorSectionProps {
  xroadError?: XRoadError;
}

export const ResponseXRoadErrorSection: React.FC<ResponseXRoadErrorSectionProps> = ({ xroadError }) => {
  if (!xroadError) {
    return null;
  }

  return (
    <Alert color="danger">
      <strong>
        <Translate contentKey="xroad.response.xroadError">X-Road Error</Translate>
      </strong>
      <div className="mt-2">
        <div>
          <strong>
            <Translate contentKey="xroad.response.xroadErrorType">Type</Translate>:
          </strong>{' '}
          {xroadError.type}
        </div>
        <div>
          <strong>
            <Translate contentKey="xroad.response.xroadErrorMessage">Message</Translate>:
          </strong>{' '}
          {xroadError.message}
        </div>
        {xroadError.detail && (
          <div>
            <strong>
              <Translate contentKey="xroad.response.xroadErrorDetail">Detail</Translate>:
            </strong>{' '}
            {xroadError.detail}
          </div>
        )}
        {xroadError.faultCode && (
          <div>
            <strong>
              <Translate contentKey="xroad.response.xroadErrorFaultCode">Fault Code</Translate>:
            </strong>{' '}
            {xroadError.faultCode}
          </div>
        )}
        {xroadError.faultString && (
          <div>
            <strong>
              <Translate contentKey="xroad.response.xroadErrorFaultString">Fault String</Translate>:
            </strong>{' '}
            {xroadError.faultString}
          </div>
        )}
      </div>
    </Alert>
  );
};
