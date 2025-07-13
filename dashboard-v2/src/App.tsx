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

// Placeholder components for routes
const Customers: React.FC = () => <div>Customers Page</div>;
const Jobs: React.FC = () => <div>Jobs Page</div>;
const Communications: React.FC = () => <div>Communications Page</div>;

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
              <Route path="customers" element={<Customers />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="communications" element={<Communications />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
