import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { XRoadRequest } from 'app/shared/model/xroad-request.model';
import { XRoadResponse } from 'app/shared/model/xroad-response.model';

const HISTORY_STORAGE_KEY = 'xroad-request-history';
const MAX_HISTORY_ENTRIES = 10;

export interface RequestHistoryEntry {
  id: string;
  timestamp: string;
  request: XRoadRequest;
  response: XRoadResponse | null;
}

export interface XRoadHistoryState {
  entries: RequestHistoryEntry[];
  selectedEntryId: string | null;
  sidebarOpen: boolean;
}

// Load history from localStorage
const loadHistoryFromStorage = (): RequestHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
  }
  return [];
};

// Save history to localStorage
const saveHistoryToStorage = (entries: RequestHistoryEntry[]) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
};

const initialState: XRoadHistoryState = {
  entries: loadHistoryFromStorage(),
  selectedEntryId: null,
  sidebarOpen: false,
};

const xroadHistorySlice = createSlice({
  name: 'xroadHistory',
  initialState,
  reducers: {
    addRequestToHistory(state, action: PayloadAction<{ request: XRoadRequest; response: XRoadResponse }>) {
      const { request, response } = action.payload;

      // Create sanitized request without PEM certificates
      const sanitizedRequest: XRoadRequest = {
        ...request,
        client: {
          ...request.client,
          mtlsCertificates: null, // Exclude certificates for security
        },
      };

      const entry: RequestHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        request: sanitizedRequest,
        response,
      };

      // Add to beginning of array (most recent first)
      state.entries = [entry, ...state.entries].slice(0, MAX_HISTORY_ENTRIES);

      // Auto-select the new entry
      state.selectedEntryId = entry.id;

      // Persist to localStorage
      saveHistoryToStorage(state.entries);
    },

    selectHistoryEntry(state, action: PayloadAction<string | null>) {
      state.selectedEntryId = action.payload;
    },

    deleteHistoryEntry(state, action: PayloadAction<string>) {
      const entryId = action.payload;
      state.entries = state.entries.filter(entry => entry.id !== entryId);

      // If deleted entry was selected, auto-select the most recent entry
      if (state.selectedEntryId === entryId) {
        state.selectedEntryId = state.entries.length > 0 ? state.entries[0].id : null;
      }

      // Persist to localStorage
      saveHistoryToStorage(state.entries);
    },

    clearHistory(state) {
      state.entries = [];
      state.selectedEntryId = null;

      // Clear localStorage
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear history from localStorage:', error);
      }
    },

    toggleHistorySidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },

    openHistorySidebar(state) {
      state.sidebarOpen = true;
    },

    closeHistorySidebar(state) {
      state.sidebarOpen = false;
    },
  },
});

export const {
  addRequestToHistory,
  selectHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
  toggleHistorySidebar,
  openHistorySidebar,
  closeHistorySidebar,
} = xroadHistorySlice.actions;

export default xroadHistorySlice.reducer;
