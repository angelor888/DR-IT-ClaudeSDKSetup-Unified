import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { dashboardApi } from '@services/api/dashboardApi'
import authReducer from '@features/auth/authSlice'

export const store = configureStore({
  reducer: {
    // Add the RTK Query reducer
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    // Add feature reducers
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(dashboardApi.middleware),
})

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch