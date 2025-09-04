import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LiveChatFeed } from "@/components/LiveChatFeed";
import { ChatBot } from "@/components/ChatBot";
import { 
  MessageSquare, 
  Users, 
  Filter,
  Search,
  Pause,
  Play,
  Settings,
  Crown,
  Shield,
  Heart,
  Gift
} from "lucide-react";

const chatMessages = [
  {
    id: 1,
    username: "StreamFan99",
    message: "!enter",
    timestamp: "14:23:15",
    userType: "viewer",
    avatar: "/avatar1.jpg",
    isCommand: true
  },
  {
    id: 2,
    username: "ModeratorMax",
    message: "Welcome everyone to the stream!",
    timestamp: "14:23:10",
    userType: "moderator",
    avatar: "/avatar2.jpg",
    isCommand: false
  },
  {
    id: 3,
    username: "GamingQueen",
    message: "Love this game! ❤️",
    timestamp: "14:23:05",
    userType: "subscriber",
    avatar: "/avatar3.jpg",
    isCommand: false
  },
  {
    id: 4,
    username: "BotLover",
    message: "!discord",
    timestamp: "14:22:58",
    userType: "viewer",
    avatar: "/avatar4.jpg",
    isCommand: true
  },
  {
    id: 5,
    username: "ChatMaster",
    message: "First time watching, loving the content!",
    timestamp: "14:22:45",
    userType: "viewer",
    avatar: "/avatar5.jpg",
    isCommand: false
  },
  {
    id: 6,
    username: "NightOwl",
    message: "!help",
    timestamp: "14:22:30",
    userType: "viewer",
    avatar: "/avatar6.jpg",
    isCommand: true
  },
  {
    id: 7,
    username: "ProGamer2023",
    message: "That was an insane play! 🔥",
    timestamp: "14:22:15",
    userType: "subscriber",
    avatar: "/avatar7.jpg",
    isCommand: false
  },
  {
    id: 8,
    username: "StreamLover",
    message: "!giveaway",
    timestamp: "14:22:00",
    userType: "viewer",
    avatar: "/avatar8.jpg",
    isCommand: true
  }
];

const userStats = {
  totalViewers: 1247,
  activeUsers: 89,
  moderators: 3,
  subscribers: 156,
  messagesPerMinute: 24
};

export default function ChatMonitor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isPaused, setIsPaused] = useState(false);

  const filteredMessages = chatMessages.filter(msg => {
    const matchesSearch = msg.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "commands") return matchesSearch && msg.isCommand;
    if (filterType === "moderators") return matchesSearch && msg.userType === "moderator";
    if (filterType === "subscribers") return matchesSearch && msg.userType === "subscriber";
    
    return matchesSearch;
  });

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "moderator": return <Shield className="h-3 w-3 text-kick-purple" />;
      case "subscriber": return <Crown className="h-3 w-3 text-accent" />;
      default: return null;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case "moderator": return "bg-kick-purple/20 text-kick-purple border-kick-purple/30";
      case "subscriber": return "bg-accent/20 text-accent border-accent/30";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chat Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Monitor live chat activity and user interactions.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant={isPaused ? "default" : "outline"} 
            onClick={() => setIsPaused(!isPaused)}
            className={isPaused ? "gaming-button" : ""}
          >
            {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
            {isPaused ? "Resume" : "Pause"} Chat
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="gaming-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{userStats.totalViewers}</div>
            <div className="text-sm text-muted-foreground">Total Viewers</div>
          </CardContent>
        </Card>
        <Card className="gaming-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-kick-green">{userStats.activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active in Chat</div>
          </CardContent>
        </Card>
        <Card className="gaming-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-kick-purple">{userStats.moderators}</div>
            <div className="text-sm text-muted-foreground">Moderators</div>
          </CardContent>
        </Card>
        <Card className="gaming-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{userStats.subscribers}</div>
            <div className="text-sm text-muted-foreground">Subscribers</div>
          </CardContent>
        </Card>
        <Card className="gaming-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userStats.messagesPerMinute}</div>
            <div className="text-sm text-muted-foreground">Msgs/Min</div>
          </CardContent>
        </Card>
      </div>

      {/* ChatBot Monitor */}
      <div className="mb-6">
        <ChatBot />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Live Chat Feed with Bot Controls */}
        <div className="lg:col-span-3">
          <LiveChatFeed />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Active Users */}
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-kick-green" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {chatMessages.slice(0, 8).map((user, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/20 transition-colors">
                      <div className="w-2 h-2 bg-kick-green rounded-full animate-pulse" />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground font-medium flex-1 truncate">
                        {user.username}
                      </span>
                      {getUserTypeIcon(user.userType)}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" className="w-full gaming-button">
                <Gift className="h-4 w-4 mr-2" />
                Start Giveaway
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Chat Settings
              </Button>
            </CardContent>
          </Card>

          {/* Command Usage */}
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Commands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">!enter</span>
                  <span className="text-foreground font-medium">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">!discord</span>
                  <span className="text-foreground font-medium">18</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">!help</span>
                  <span className="text-foreground font-medium">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">!giveaway</span>
                  <span className="text-foreground font-medium">8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}