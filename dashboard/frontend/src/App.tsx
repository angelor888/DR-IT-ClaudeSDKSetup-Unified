import { useMemo, useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material'
import { store } from '@app/store'
import { getTheme } from '@styles/theme'
import { websocketService } from '@services/websocket/websocket'
import { useAppSelector } from '@app/hooks'

// Import essential components directly (not lazy-loaded)
import { LoginPage } from '@features/auth/LoginPage'
import { DashboardLayout } from '@components/layout/DashboardLayout'
import { PageLoader, ComponentLoader, CommunicationsLoader } from '@components/common/LoadingSpinner'
import { ChunkErrorBoundary, RouteErrorBoundary } from '@components/common/ErrorBoundary'
import { PWAInstallPrompt } from '@components/PWAInstallPrompt'

// Lazy load feature components for code splitting
const Dashboard = lazy(() => import('@features/dashboard/Dashboard').then(module => ({ default: module.Dashboard })))

// Customer Management components (lazy)
const CustomerList = lazy(() => import('@features/customers').then(module => ({ default: module.CustomerList })))
const CustomerForm = lazy(() => import('@features/customers').then(module => ({ default: module.CustomerForm })))
const CustomerDetail = lazy(() => import('@features/customers').then(module => ({ default: module.CustomerDetail })))

// Job Management components (lazy)
const JobList = lazy(() => import('@features/jobs').then(module => ({ default: module.JobList })))
const JobForm = lazy(() => import('@features/jobs').then(module => ({ default: module.JobForm })))
const JobDetail = lazy(() => import('@features/jobs').then(module => ({ default: module.JobDetail })))
const JobCalendar = lazy(() => import('@features/jobs').then(module => ({ default: module.JobCalendar })))

// Communications component (lazy)
const Communications = lazy(() => import('@features/communications').then(module => ({ default: module.Communications })))

// AI Learning Hub components (lazy)
const AIProjects = lazy(() => import('@features/ai-learning/AIProjects').then(module => ({ default: module.AIProjects })))
const AIProjectDetail = lazy(() => import('@features/ai-learning/AIProjectDetail').then(module => ({ default: module.AIProjectDetail })))
const PromptLibrary = lazy(() => import('@features/ai-learning/PromptLibrary').then(module => ({ default: module.PromptLibrary })))
const WorkflowTemplates = lazy(() => import('@features/ai-learning/WorkflowTemplates').then(module => ({ default: module.WorkflowTemplates })))
const AIProgress = lazy(() => import('@features/ai-learning/AIProgress').then(module => ({ default: module.AIProgress })))
const KnowledgeSharing = lazy(() => import('@features/ai-learning/KnowledgeSharing').then(module => ({ default: module.KnowledgeSharing })))


// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  )
}

// Main App component
function AppContent() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const theme = useMemo(() => getTheme(themeMode), [themeMode])
  const token = useAppSelector((state) => state.auth.token)

  // Connect WebSocket when authenticated (if enabled)
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_WEBSOCKET === 'true' && token) {
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
      <PWAInstallPrompt />
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
            <Route index element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } />
            
            {/* Customer Management Routes */}
            <Route path="customers" element={
              <Suspense fallback={<ComponentLoader />}>
                <CustomerList />
              </Suspense>
            } />
            <Route path="customers/new" element={
              <Suspense fallback={<ComponentLoader />}>
                <CustomerForm />
              </Suspense>
            } />
            <Route path="customers/:id" element={
              <Suspense fallback={<ComponentLoader />}>
                <CustomerDetail />
              </Suspense>
            } />
            <Route path="customers/:id/edit" element={
              <Suspense fallback={<ComponentLoader />}>
                <CustomerForm />
              </Suspense>
            } />
            
            {/* Job Management Routes */}
            <Route path="jobs" element={
              <Suspense fallback={<ComponentLoader />}>
                <JobList />
              </Suspense>
            } />
            <Route path="jobs/new" element={
              <Suspense fallback={<ComponentLoader />}>
                <JobForm />
              </Suspense>
            } />
            <Route path="jobs/:id" element={
              <Suspense fallback={<ComponentLoader />}>
                <JobDetail />
              </Suspense>
            } />
            <Route path="jobs/:id/edit" element={
              <Suspense fallback={<ComponentLoader />}>
                <JobForm />
              </Suspense>
            } />
            
            {/* Calendar Route */}
            <Route path="calendar" element={
              <Suspense fallback={<ComponentLoader />}>
                <JobCalendar />
              </Suspense>
            } />
            
            {/* Communications Route */}
            <Route path="communications" element={
              <Suspense fallback={<CommunicationsLoader />}>
                <Communications />
              </Suspense>
            } />
            
            {/* AI Learning Hub Routes */}
            <Route path="ai-learning" element={
              <Suspense fallback={<ComponentLoader />}>
                <AIProjects />
              </Suspense>
            } />
            <Route path="ai-learning/projects/:id" element={
              <Suspense fallback={<ComponentLoader />}>
                <AIProjectDetail />
              </Suspense>
            } />
            <Route path="ai-learning/prompts" element={
              <Suspense fallback={<ComponentLoader />}>
                <PromptLibrary />
              </Suspense>
            } />
            <Route path="ai-learning/workflows" element={
              <Suspense fallback={<ComponentLoader />}>
                <WorkflowTemplates />
              </Suspense>
            } />
            <Route path="ai-learning/progress" element={
              <Suspense fallback={<ComponentLoader />}>
                <AIProgress />
              </Suspense>
            } />
            <Route path="ai-learning/knowledge" element={
              <Suspense fallback={<ComponentLoader />}>
                <KnowledgeSharing />
              </Suspense>
            } />
            
            <Route path="reports" element={<div>Reports - Coming Soon</div>} />
            <Route path="settings" element={<div>Settings - Coming Soon</div>} />
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
      <ChunkErrorBoundary>
        <AppContent />
      </ChunkErrorBoundary>
    </Provider>
  )
}

export default App