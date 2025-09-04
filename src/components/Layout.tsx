import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { 
  Settings, 
  LogOut, 
  Home, 
  History, 
  Gift, 
  Settings as SettingsIcon,
  Bot,
  MonitorPlay,
  Trophy
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  // Check for Kick authentication
  const kickUserData = localStorage.getItem('kick_user');
  const kickUser = kickUserData ? JSON.parse(kickUserData) : null;
  const isGuestMode = localStorage.getItem('guest_mode') === 'true';

  // Determine current user info
  const getCurrentUserInfo = () => {
    if (kickUser?.authenticated) {
      return {
        username: kickUser.username,
        displayName: kickUser.display_name || kickUser.username,
        avatar: kickUser.avatar,
        initials: kickUser.username?.slice(0, 2).toUpperCase() || 'KU'
      };
    } else if (user) {
      return {
        username: user.email?.split('@')[0] || 'User',
        displayName: user.email?.split('@')[0] || 'User', 
        avatar: null,
        initials: user.email?.slice(0, 2).toUpperCase() || 'U'
      };
    } else if (isGuestMode) {
      return {
        username: 'Guest',
        displayName: 'Guest User',
        avatar: null,
        initials: 'G'
      };
    }
    return {
      username: 'User',
      displayName: 'User',
      avatar: null,
      initials: 'U'
    };
  };

  const userInfo = getCurrentUserInfo();

  const handleSignOut = async () => {
    // Clear guest mode and Kick auth data
    localStorage.removeItem('guest_mode');
    localStorage.removeItem('kick_user');
    localStorage.removeItem('kick_token');
    
    // Sign out from Supabase if user is authenticated
    if (user) {
      await signOut();
    }
    
    // Redirect to auth page
    window.location.href = '/auth';
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/giveaways", label: "Giveaways", icon: Gift },
    
    { path: "/chat-monitor", label: "Chat Monitor", icon: MonitorPlay },
    { path: "/bot-settings", label: "Bot Settings", icon: SettingsIcon },
    { path: "/history", label: "History", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Header */}
      <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-kick-green to-kick-purple bg-clip-text text-transparent">
              Kick Bot Dashboard
            </h1>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Right Side - Status and User */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-kick-green border-kick-green/30">
              <div className="w-2 h-2 bg-kick-green rounded-full mr-2 animate-pulse" />
              Bot Online
            </Badge>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {userInfo.avatar ? (
                  <AvatarImage src={userInfo.avatar} alt={userInfo.username} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                  {userInfo.initials}
                </AvatarFallback>
              </Avatar>
              <Link 
                to="/account" 
                className="text-sm font-medium hidden sm:block hover:text-primary transition-colors cursor-pointer"
              >
                {userInfo.displayName}
              </Link>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border/30">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}