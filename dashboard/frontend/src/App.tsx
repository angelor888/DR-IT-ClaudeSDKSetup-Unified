import { useMemo, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { store } from '@app/store'
import { getTheme } from '@styles/theme'
import { websocketService } from '@services/websocket/websocket'
import { useAppSelector } from '@app/hooks'

// Import feature components
import { LoginPage } from '@features/auth/LoginPage'
import { DashboardLayout } from '@components/layout/DashboardLayout'
import { Dashboard } from '@features/dashboard/Dashboard'

// Temporary placeholder components for features not yet implemented
const CustomerList = () => <div>Customer List - Coming Soon</div>
const JobList = () => <div>Job List - Coming Soon</div>

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Main App component
function AppContent() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const theme = useMemo(() => getTheme(themeMode), [themeMode])
  const token = useAppSelector((state) => state.auth.token)

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (token) {
      websocketService.connect(token)
    } else {
      websocketService.disconnect()
    }

    return () => {
      websocketService.disconnect()
    }
  }, [token])

  // Toggle theme function
  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="jobs" element={<JobList />} />
            {/* Add more routes as we build features */}
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App