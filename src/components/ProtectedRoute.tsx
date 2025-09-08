import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  console.log('🔐 ProtectedRoute check:', { user: !!user, loading });
  
  // Check for guest mode or Kick authentication
  const isGuestMode = localStorage.getItem('guest_mode') === 'true';
  const kickUser = localStorage.getItem('kick_user');
  const isKickAuthenticated = kickUser ? JSON.parse(kickUser).authenticated : false;

  console.log('🔐 ProtectedRoute auth states:', { 
    isGuestMode, 
    isKickAuthenticated, 
    hasUser: !!user,
    userEmail: user?.email 
  });

  if (loading) {
    console.log('🔐 ProtectedRoute showing loading...');
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
  const hasAccess = user || isGuestMode || isKickAuthenticated;
  console.log('🔐 ProtectedRoute access decision:', { hasAccess, redirectingToAuth: !hasAccess });
  
  if (!hasAccess) {
    return <Navigate to="/auth" replace />;
  }

  console.log('🔐 ProtectedRoute allowing access, rendering children');
  return <>{children}</>;
}