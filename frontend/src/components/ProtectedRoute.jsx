import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-height-screen min-h-screen bg-brand-cream dark:bg-neutral-900">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-red-medium border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1 left-1 w-14 h-14 border-4 border-brand-green-medium border-b-transparent rounded-full animate-spin animate-reverse"></div>
        </div>
        <p className="mt-4 text-brand-red-dark dark:text-brand-cream font-semibold text-lg animate-pulse">
          Loading Sabeel Portal...
        </p>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    if (allowedRole === 'admin') {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based authorization
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
