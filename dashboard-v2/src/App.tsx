import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store';
import { theme } from './utils/theme';

// Components
import LoginPage from './features/auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './features/dashboard/Dashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import CustomerList from './features/customers/CustomerList';
import JobList from './features/jobs/JobList';
import UnifiedInbox from './features/communications/UnifiedInbox';

function App() {
  return (
    <Provider store={store}>
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
              <Route path="communications" element={<UnifiedInbox />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
