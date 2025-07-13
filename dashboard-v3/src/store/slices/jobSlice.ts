import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job } from '../../types';

interface JobState {
  list: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    status: string[];
    priority: string[];
    assignedTo: string[];
  };
  viewMode: 'list' | 'kanban' | 'calendar';
}

const initialState: JobState = {
  list: [],
  selectedJob: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  filters: {
    status: [],
    priority: [],
    assignedTo: [],
  },
  viewMode: 'list',
};

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.list = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addJob: (state, action: PayloadAction<Job>) => {
      state.list.push(action.payload);
    },
    updateJob: (state, action: PayloadAction<Job>) => {
      const index = state.list.findIndex(job => job.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    deleteJob: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(job => job.id !== action.payload);
    },
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<JobState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setViewMode: (state, action: PayloadAction<JobState['viewMode']>) => {
      state.viewMode = action.payload;
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
  setJobs,
  addJob,
  updateJob,
  deleteJob,
  setSelectedJob,
  setSearchTerm,
  setFilters,
  setViewMode,
  setError,
  clearError,
} = jobSlice.actions;
export default jobSlice.reducer;