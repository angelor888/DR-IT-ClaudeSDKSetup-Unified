import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@services/api/dashboardApi'
import { dashboardApi } from '@services/api/dashboardApi'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Initialize auth state from localStorage
const token = localStorage.getItem('token')
const userString = localStorage.getItem('user')
let user: User | null = null

try {
  user = userString ? JSON.parse(userString) : null
} catch {
  // Clear invalid user data
  localStorage.removeItem('user')
}

const initialState: AuthState = {
  user,
  token,
  isAuthenticated: !!(token && user),
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
      localStorage.removeItem('user')
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
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
        localStorage.setItem('user', JSON.stringify(payload.user))
      }
    )
  },
})

export const { logout, setCredentials } = authSlice.actions
export default authSlice.reducer