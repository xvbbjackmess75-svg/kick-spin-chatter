import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useKickAccount } from "@/hooks/useKickAccount";
import { 
  Settings, 
  LogOut, 
  Home, 
  History, 
  Gift, 
  Settings as SettingsIcon,
  Bot,
  MonitorPlay,
  Trophy,
  Zap,
  Phone,
  Menu,
  User
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const { kickUser } = useKickAccount();
  const { role } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  

  // Determine current user info
  const getCurrentUserInfo = () => {
    console.log('🔍 Layout - Current state:', { 
      kickUser: kickUser ? {
        authenticated: kickUser.authenticated,
        username: kickUser.username,
        avatar: kickUser.avatar
      } : null,
      user: user ? { email: user.email } : null,
      profile: profile ? { 
        display_name: profile.display_name, 
        avatar_url: profile.avatar_url,
        updated_at: profile.updated_at 
      } : null
    });
    
    if (kickUser?.authenticated) {
      console.log('📱 Layout using Kick user:', kickUser);
      return {
        username: kickUser.username,
        displayName: kickUser.display_name || kickUser.username,
        avatar: kickUser.avatar,
        initials: kickUser.username?.slice(0, 2).toUpperCase() || 'KU'
      };
    } else if (user) {
      // Use profile display_name if available, otherwise fall back to email
      const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
      console.log('👤 Layout using Supabase user:', { displayName, avatar: profile?.avatar_url });
      return {
        username: user.email?.split('@')[0] || 'User',
        displayName: displayName,
        avatar: profile?.avatar_url || null,
        initials: displayName.slice(0, 2).toUpperCase() || 'U'
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
  
  console.log('🎯 Layout final userInfo:', userInfo);
  
  // Force re-render when profile changes by using profile as dependency
  const profileKey = profile ? `${profile.display_name}-${profile.updated_at}` : 'no-profile';

  const handleSignOut = async () => {
    // Clear Kick auth data
    localStorage.removeItem('kick_user');
    localStorage.removeItem('kick_token');
    
    // Sign out from Supabase if user is authenticated
    if (user) {
      await signOut();
    }
    
    // Redirect to auth page using navigate to prevent full page reload
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  // Define navigation items based on user role
  const getNavItems = () => {
    if (role === 'viewer' || role === 'verified_viewer') {
      // Viewer role gets limited access - only dashboard and account settings
      return [
        { path: "/dashboard", label: "Dashboard", icon: Home },
      ];
    } else {
      // Streamer roles (user, premium, vip_plus, admin) get full access
      return [
        { path: "/dashboard", label: "Dashboard", icon: Home },
        { path: "/giveaways", label: "Giveaways", icon: Gift },
        { path: "/bonus-hunt", label: "Bonus Hunt", icon: Zap },
        { path: "/slots-calls", label: "Slots Calls", icon: Phone },
        { path: "/history", label: "History", icon: Trophy },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Header */}
      <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                </div>
                <nav className="p-4">
                  <div className="space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isActive(item.path)
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <Link
                      to="/account"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Account Settings</span>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 px-3 py-3 mt-2 text-muted-foreground hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-kick-green to-kick-purple bg-clip-text text-transparent">
              Kick Bot Dashboard
            </h1>
            
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
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
          <div className="flex items-center gap-2 md:gap-4">
            <Badge variant="outline" className="text-kick-green border-kick-green/30 hidden sm:flex">
              <div className="w-2 h-2 bg-kick-green rounded-full mr-2 animate-pulse" />
              Bot Online
            </Badge>
            
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-muted/50">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/80">
                      <img 
                        src={userInfo.avatar} 
                        alt={userInfo.username}
                        className="h-full w-full object-cover"
                        onLoad={() => {
                          console.log('✅ Header avatar loaded successfully:', userInfo.avatar);
                        }}
                        onError={(e) => {
                          console.error('❌ Header avatar failed to load:', userInfo.avatar);
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
              <span className="text-sm font-medium text-muted-foreground">
                {userInfo.displayName}
              </span>
            </div>

            {/* Mobile User Avatar - Clickable */}
            <div className="md:hidden">
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
                <DropdownMenuContent className="w-56 bg-background border border-border shadow-lg mr-4" align="end">
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