import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Zap, LogIn, UserPlus } from 'lucide-react';

interface PageHeaderProps {
  showAuthButtons?: boolean;
}

export function PageHeader({ showAuthButtons = true }: PageHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Smart navigation function that routes authenticated users to dashboard
  const handleHomeNavigation = () => {
    // Check for Kick authentication as well
    const kickUser = localStorage.getItem('kick_user');
    const isKickAuthenticated = kickUser ? JSON.parse(kickUser).authenticated : false;
    
    if (user || isKickAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleHomeNavigation}
          >
            <div className="relative">
              <Zap className="h-8 w-8 text-kick-green" />
              <div className="absolute inset-0 animate-pulse">
                <Zap className="h-8 w-8 text-kick-green opacity-50" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KickHelper
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={handleHomeNavigation}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/viewer-benefits')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Viewer Benefits
            </button>
            <button
              onClick={() => navigate('/slots-overlay')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Live Demo
            </button>
          </nav>

          {/* Auth Buttons */}
          {showAuthButtons && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:flex"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
              <Button
                size="sm"
                className="gaming-button"
                onClick={() => navigate('/auth')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}