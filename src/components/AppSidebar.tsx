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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
  Dices,
  Shield,
  ChevronDown,
  Target
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const bonusHuntItems = [
  { title: "Bonus Hunt", url: "/bonus-hunt", icon: Trophy },
  { title: "Slot Picker", url: "/slot-picker", icon: Target },
];

const streamerItems = [
  { title: "Giveaways", url: "/giveaways", icon: Gift },
  { title: "Twitter Giveaways", url: "/twitter-giveaways", icon: Gift },
  { title: "Slots Calls", url: "/slots-calls", icon: Dices },
  { title: "History", url: "/history", icon: History },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isAdmin, hasStreamerAccess, role, loading } = useUserRole();
  const [bonusHuntOpen, setBonusHuntOpen] = useState(
    currentPath === "/bonus-hunt" || currentPath === "/slot-picker"
  );
  
  console.log('🔧 AppSidebar - Full state:', { 
    role, 
    loading, 
    isAdmin: isAdmin(), 
    hasStreamerAccess: hasStreamerAccess(),
    currentPath 
  });

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
                <h2 className="text-lg font-bold text-foreground">KickHelper</h2>
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
              
              {/* Bonus Hunt Submenu */}
              <Collapsible open={bonusHuntOpen} onOpenChange={setBonusHuntOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full justify-start transition-all duration-200 hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
                      <Trophy className="h-5 w-5 mr-3" />
                      {!collapsed && (
                        <>
                          <span className="font-medium flex-1">Bonus Hunt</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${bonusHuntOpen ? "rotate-180" : ""}`} />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {bonusHuntItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink 
                              to={item.url} 
                              className={({ isActive }) => 
                                `transition-all duration-200 ${isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`
                              }
                            >
                              <item.icon className="h-4 w-4 mr-2" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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