import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import dashboardSlice from './slices/dashboardSlice';
import customerSlice from './slices/customerSlice';
import jobSlice from './slices/jobSlice';
import communicationSlice from './slices/communicationSlice';
import aiSlice from './slices/aiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    dashboard: dashboardSlice,
    customers: customerSlice,
    jobs: jobSlice,
    communications: communicationSlice,
    ai: aiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for Firebase dates
        ignoredActions: [
          'auth/setUser',
          'dashboard/setMetrics',
          'customers/setCustomers',
          'jobs/setJobs',
          'communications/setCommunications',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.lastLogin',
          'customers.list.createdAt',
          'customers.list.updatedAt',
          'jobs.list.scheduledDate',
          'jobs.list.completedDate',
          'communications.list.createdAt',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;