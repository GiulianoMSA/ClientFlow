import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">
          Carregando...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;