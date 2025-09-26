import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useKickAccount } from '@/hooks/useKickAccount';
import { getBestAvatar, getUserInitials } from '@/lib/avatarUtils';
import { Zap, LogIn, UserPlus, User, LogOut } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface PageHeaderProps {
  showAuthButtons?: boolean;
}

export function PageHeader({ showAuthButtons = true }: PageHeaderProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { kickUser } = useKickAccount();

  // Check for Kick authentication
  const kickUserData = localStorage.getItem('kick_user');
  const isKickAuthenticated = kickUserData ? JSON.parse(kickUserData).authenticated : false;
  const isAuthenticated = !!(user || isKickAuthenticated);

  // Get current user info for display
  const getCurrentUserInfo = () => {
    if (kickUser?.authenticated) {
      const avatarInfo = getBestAvatar({
        customAvatar: profile?.custom_avatar_url,
        kickAvatar: kickUser.avatar,
        kickUsername: kickUser.username
      });
      const initials = getUserInitials({
        displayName: kickUser.display_name,
        username: kickUser.username
      });
      
      return {
        username: kickUser.username,
        displayName: kickUser.display_name || kickUser.username,
        avatar: avatarInfo,
        initials
      };
    } else if (user) {
      const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
      const avatarInfo = getBestAvatar({
        customAvatar: profile?.custom_avatar_url,
        kickAvatar: profile?.avatar_url
      });
      const initials = getUserInitials({
        displayName,
        username: user.email?.split('@')[0],
        email: user.email
      });
      
      return {
        username: user.email?.split('@')[0] || 'User',
        displayName: displayName,
        avatar: avatarInfo,
        initials
      };
    }
    return null;
  };

  const userInfo = getCurrentUserInfo();

  // Handle sign out
  const handleSignOut = async () => {
    // Clear Kick auth data
    localStorage.removeItem('kick_user');
    localStorage.removeItem('kick_token');
    
    // Sign out from Supabase if user is authenticated
    if (user) {
      await signOut();
    }
    
    // Redirect to auth page
    navigate('/auth');
  };

  // Smart navigation function that routes authenticated users to dashboard
  const handleHomeNavigation = () => {
    if (isAuthenticated) {
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

          {/* Auth Buttons or User Info */}
          {showAuthButtons && (
            <div className="flex items-center gap-3">
              {isAuthenticated && userInfo ? (
                // Show user dropdown when authenticated
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-muted/50">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/80">
                        <img 
                          src={userInfo.avatar} 
                          alt={userInfo.username}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="absolute inset-0 flex items-center justify-center text-primary-foreground text-sm font-semibold"
                          style={{ display: 'none' }}
                        >
                          {userInfo.initials}
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border border-border shadow-lg" align="end">
                    <div className="flex items-center gap-2 p-3 border-b">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/80">
                        <img 
                          src={userInfo.avatar} 
                          alt={userInfo.username}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="absolute inset-0 flex items-center justify-center text-primary-foreground text-xs font-semibold"
                          style={{ display: 'none' }}
                        >
                          {userInfo.initials}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{userInfo.displayName}</p>
                        <p className="text-xs text-muted-foreground">{userInfo.username}</p>
                      </div>
                    </div>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate('/dashboard')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate('/account')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Show auth buttons when not authenticated
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}