import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingFlow from './pages/OnboardingFlow';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminAccess from './pages/admin/AdminAccess';

// Dashboard Pages
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import PipelineView from './pages/dashboard/PipelineView';
import ListingManager from './pages/dashboard/ListingManager';
import Connections from './pages/dashboard/Connections';

import './index.css';

function App() {
  return (
    <ThemeProvider>
      <ConfirmDialogProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="access" element={<AdminAccess />} />
          </Route>

          {/* Agent Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRole="agent">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="pipeline" element={<PipelineView />} />
            <Route path="listings" element={<ListingManager />} />
            <Route path="connections" element={<Connections />} />
          </Route>
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ConfirmDialogProvider>
    </ThemeProvider>
  );
}

export default App;
