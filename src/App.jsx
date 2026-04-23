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
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingFlow from './pages/OnboardingFlow';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminAccess from './pages/admin/AdminAccess';
import AdminFeedback from './pages/admin/AdminFeedback';

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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="access" element={<AdminAccess />} />
            <Route path="feedback" element={<AdminFeedback />} />
          </Route>

          {/* Agent Dashboard — pathless layout so children get flat URLs */}
          <Route element={
            <ProtectedRoute allowedRole="agent">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/pipeline" element={<PipelineView />} />
            <Route path="/listings" element={<ListingManager />} />
            <Route path="/connections" element={<Connections />} />
          </Route>

          {/* Legacy redirects — old bookmarks / emails still work */}
          <Route path="/dashboard/pipeline" element={<Navigate to="/pipeline" replace />} />
          <Route path="/dashboard/listings" element={<Navigate to="/listings" replace />} />
          <Route path="/dashboard/connections" element={<Navigate to="/connections" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ConfirmDialogProvider>
    </ThemeProvider>
  );
}

export default App;
