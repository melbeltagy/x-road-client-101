import React, { useEffect } from 'react';
import { Offcanvas, OffcanvasBody, OffcanvasHeader, Button, Alert, ListGroup } from 'reactstrap';
import { Translate, translate } from 'app/shared/i18n';
import { useAppSelector, useAppDispatch } from 'app/config/store';
import { RequestHistoryEntry, clearHistory, closeHistorySidebar } from 'app/shared/reducers/xroad-history';
import { HistoryEntry } from './history-entry';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface HistoryListProps {
  onView: (entry: RequestHistoryEntry) => void;
  onDelete: (entryId: string) => void;
  showAlert: (color: 'success' | 'danger' | 'warning', message: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onView, onDelete, showAlert }) => {
  const dispatch = useAppDispatch();
  const { entries, selectedEntryId, sidebarOpen } = useAppSelector(state => state.xroadHistory);

  const handleClearAll = () => {
    if (window.confirm(translate('xroad.history.confirmClear'))) {
      dispatch(clearHistory());
      showAlert('success', translate('xroad.history.cleared'));
    }
  };

  const handleClose = () => {
    dispatch(closeHistorySidebar());
  };

  // Handle clicks outside the sidebar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close if clicking outside the offcanvas (check for offcanvas class)
      if (sidebarOpen && !target.closest('.offcanvas')) {
        handleClose();
      }
    };

    if (sidebarOpen) {
      // Add a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarOpen]);

  return (
    <>
      {/* Custom semi-transparent overlay that allows scrolling */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1040,
            pointerEvents: 'none',
          }}
        />
      )}
      <Offcanvas isOpen={sidebarOpen} toggle={handleClose} direction="end" style={{ width: '400px' }} backdrop={false}>
        <OffcanvasHeader toggle={handleClose}>
          <Translate contentKey="xroad.history.title">Request History</Translate>
        </OffcanvasHeader>
        <OffcanvasBody className="p-0">
          {entries.length === 0 ? (
            <Alert color="info" className="m-3">
              <div className="text-center">
                <FontAwesomeIcon icon="history" size="3x" className="mb-3 text-muted" />
                <h5>
                  <Translate contentKey="xroad.history.empty">No request history yet</Translate>
                </h5>
                <p className="text-muted">
                  <Translate contentKey="xroad.history.emptyDescription">Make a request to see it here</Translate>
                </p>
              </div>
            </Alert>
          ) : (
            <>
              <div className="border-bottom p-3">
                <Button color="danger" size="sm" outline onClick={handleClearAll}>
                  <FontAwesomeIcon icon="trash-alt" className="me-1" />
                  <Translate contentKey="xroad.history.clearAll">Clear All History</Translate>
                </Button>
              </div>
              <ListGroup flush style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {entries.map(entry => (
                  <HistoryEntry
                    key={entry.id}
                    entry={entry}
                    isSelected={entry.id === selectedEntryId}
                    onView={onView}
                    onDelete={onDelete}
                  />
                ))}
              </ListGroup>
            </>
          )}
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
};
