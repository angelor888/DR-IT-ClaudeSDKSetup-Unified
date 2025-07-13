import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Communication } from '../../types';

interface CommunicationState {
  list: Communication[];
  unreadCount: number;
  selectedCommunication: Communication | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type: string[];
    status: string[];
    direction: string[];
  };
}

const initialState: CommunicationState = {
  list: [],
  unreadCount: 0,
  selectedCommunication: null,
  isLoading: false,
  error: null,
  filters: {
    type: [],
    status: [],
    direction: [],
  },
};

const communicationSlice = createSlice({
  name: 'communications',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCommunications: (state, action: PayloadAction<Communication[]>) => {
      state.list = action.payload;
      state.unreadCount = action.payload.filter(comm => comm.status !== 'read').length;
      state.isLoading = false;
      state.error = null;
    },
    addCommunication: (state, action: PayloadAction<Communication>) => {
      state.list.unshift(action.payload);
      if (action.payload.status !== 'read') {
        state.unreadCount += 1;
      }
    },
    updateCommunication: (state, action: PayloadAction<Communication>) => {
      const index = state.list.findIndex(comm => comm.id === action.payload.id);
      if (index !== -1) {
        const oldComm = state.list[index];
        state.list[index] = action.payload;
        
        // Update unread count
        if (oldComm.status !== 'read' && action.payload.status === 'read') {
          state.unreadCount -= 1;
        } else if (oldComm.status === 'read' && action.payload.status !== 'read') {
          state.unreadCount += 1;
        }
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const comm = state.list.find(c => c.id === action.payload);
      if (comm && comm.status !== 'read') {
        comm.status = 'read';
        state.unreadCount -= 1;
      }
    },
    setSelectedCommunication: (state, action: PayloadAction<Communication | null>) => {
      state.selectedCommunication = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<CommunicationState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setCommunications,
  addCommunication,
  updateCommunication,
  markAsRead,
  setSelectedCommunication,
  setFilters,
  setError,
  clearError,
} = communicationSlice.actions;
export default communicationSlice.reducer;