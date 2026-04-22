import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user's role doesn't match, redirect them
  // Admin shouldn't necessarily be blocked from dashboard, but agents blocked from admin
  // Agents trying to access admin → send to dashboard
  if (allowedRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Admins trying to access agent dashboard → send to admin
  if (allowedRole === 'agent' && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
