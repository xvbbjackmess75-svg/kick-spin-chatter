import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Gift, 
  Bot,
  Users,
  Zap,
  Trophy,
  History,
  Monitor,
  Dices,
  Shield
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Bonus Hunt", url: "/bonus-hunt", icon: Trophy },
];

const streamerItems = [
  { title: "Giveaways", url: "/giveaways", icon: Gift },
  { title: "Slots Calls", url: "/slots-calls", icon: Dices },
  { title: "History", url: "/history", icon: History },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isAdmin, hasStreamerAccess } = useUserRole();

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `w-full justify-start transition-all duration-200 ${
      isActive 
        ? "bg-gradient-primary text-primary-foreground shadow-lg" 
        : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
    }`;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card/80 backdrop-blur-md border-r border-border/50">
        {/* Logo */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-foreground">KickBot</h2>
                <p className="text-xs text-muted-foreground">Pro</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            {!collapsed && "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-5 w-5 mr-3" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Streamer Features */}
        {hasStreamerAccess() && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-kick-green font-semibold">
              {!collapsed && "Streaming"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {streamerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavClass}>
                        <item.icon className="h-5 w-5 mr-3" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-destructive font-semibold">
              {!collapsed && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className={getNavClass}>
                      <Shield className="h-5 w-5 mr-3" />
                      {!collapsed && <span className="font-medium">Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
    </Sidebar>
  );
}