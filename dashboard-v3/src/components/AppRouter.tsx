import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoadingScreen from './common/LoadingScreen';
import LoginPage from '../pages/auth/LoginPage';
import DashboardLayout from './layout/DashboardLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import CustomersPage from '../pages/customers/CustomersPage';
import JobsPage from '../pages/jobs/JobsPage';
import CommunicationsPage from '../pages/communications/CommunicationsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import AIAssistantPage from '../pages/ai/AIAssistantPage';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/communications" element={<CommunicationsPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default AppRouter;