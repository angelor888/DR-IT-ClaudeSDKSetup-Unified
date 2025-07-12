import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@services/api/dashboardApi'
import { dashboardApi } from '@services/api/dashboardApi'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      dashboardApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.user
        state.token = payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', payload.token)
      }
    )
  },
})

export const { logout, setCredentials } = authSlice.actions
export default authSlice.reducer