import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../store';

// Create our base API
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state
      const token = (getState() as RootState).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Customer',
    'CustomerSync',
    'CustomerTags',
    'Job',
    'JobStats',
    'JobSync',
    'JobCalendar',
    'JobTemplate',
    'JobTags',
    'JobCategories',
    'Message',
    'Conversation',
    'Template',
    'Preferences',
    'Stats',
    'Analytics'
  ],
  endpoints: () => ({}),
});

// Export reducer
export const { reducerPath, reducer, middleware } = dashboardApi;