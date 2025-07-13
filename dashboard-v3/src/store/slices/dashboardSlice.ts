import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardMetrics } from '../../types';

interface DashboardState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: DashboardState = {
  metrics: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setMetrics: (state, action: PayloadAction<DashboardMetrics>) => {
      state.metrics = action.payload;
      state.lastUpdated = new Date();
      state.isLoading = false;
      state.error = null;
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

export const { setLoading, setMetrics, setError, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;