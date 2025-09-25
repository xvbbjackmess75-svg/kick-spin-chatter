import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturnHome = () => {
    // Check for Kick authentication as well
    const kickUser = localStorage.getItem('kick_user');
    const isKickAuthenticated = kickUser ? JSON.parse(kickUser).authenticated : false;
    
    if (user || isKickAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        <Button 
          onClick={handleReturnHome}
          className="gaming-button"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
