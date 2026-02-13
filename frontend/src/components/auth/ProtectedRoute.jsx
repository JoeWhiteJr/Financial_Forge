import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-forge-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
