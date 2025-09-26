import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green mx-auto" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}