import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  // Check for guest mode or Kick authentication
  const isGuestMode = localStorage.getItem('guest_mode') === 'true';
  const kickUser = localStorage.getItem('kick_user');
  const isKickAuthenticated = kickUser ? JSON.parse(kickUser).authenticated : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if user is authenticated OR in guest mode OR authenticated with Kick
  if (!user && !isGuestMode && !isKickAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}