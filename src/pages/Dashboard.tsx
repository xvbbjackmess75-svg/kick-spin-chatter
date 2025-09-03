import { LiveChatFeed } from "@/components/LiveChatFeed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  MessageSquare, 
  Gift, 
  TrendingUp,
  Play,
  Pause,
  Eye,
  Crown,
  Zap
} from "lucide-react";

const stats = [
  {
    title: "Active Viewers",
    value: "1,247",
    change: "+12%",
    icon: Users,
    color: "text-kick-green"
  },
  {
    title: "Chat Messages",
    value: "8,432",
    change: "+24%",
    icon: MessageSquare,
    color: "text-kick-purple"
  },
  {
    title: "Active Giveaways",
    value: "3",
    change: "0%",
    icon: Gift,
    color: "text-accent"
  },
  {
    title: "Bot Commands",
    value: "156",
    change: "+8%",
    icon: TrendingUp,
    color: "text-primary"
  }
];

const recentActivity = [
  { user: "GamerPro123", action: "entered giveaway", time: "2s ago", type: "giveaway" },
  { user: "StreamFan", action: "used !discord command", time: "15s ago", type: "command" },
  { user: "NightOwl99", action: "became a follower", time: "1m ago", type: "follow" },
  { user: "ChatMaster", action: "entered giveaway", time: "2m ago", type: "giveaway" },
  { user: "BotLover", action: "used !help command", time: "3m ago", type: "command" },
];

const activeGiveaways = [
  {
    id: 1,
    title: "Gaming Headset",
    participants: 127,
    maxParticipants: 200,
    timeLeft: "5m 32s",
    status: "active"
  },
  {
    id: 2,
    title: "Steam Gift Card",
    participants: 89,
    maxParticipants: 150,
    timeLeft: "12m 18s",
    status: "active"
  },
  {
    id: 3,
    title: "VIP Discord Role",
    participants: 245,
    maxParticipants: 300,
    timeLeft: "25m 45s",
    status: "active"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your stream.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="gaming-button">
            <Play className="h-4 w-4 mr-2" />
            Start Bot
          </Button>
          <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
            <Pause className="h-4 w-4 mr-2" />
            Stop Bot
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="gaming-card hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center mt-1">
                <Badge variant={stat.change.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                  {stat.change}
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">from last hour</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Giveaways */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="gaming-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Active Giveaways
              </CardTitle>
              <Button size="sm" className="gaming-button">
                <Gift className="h-4 w-4 mr-2" />
                New Giveaway
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGiveaways.map((giveaway) => (
              <div key={giveaway.id} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{giveaway.title}</h4>
                  <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30">
                    {giveaway.timeLeft}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Participants</span>
                    <span className="text-foreground font-medium">
                      {giveaway.participants}/{giveaway.maxParticipants}
                    </span>
                  </div>
                  <Progress 
                    value={(giveaway.participants / giveaway.maxParticipants) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-3 w-3 mr-2" />
                    View
                  </Button>
                  <Button size="sm" className="gaming-button flex-1">
                    <Zap className="h-3 w-3 mr-2" />
                    Draw Winner
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/20 transition-colors chat-message">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'giveaway' ? 'bg-accent' :
                    activity.type === 'command' ? 'bg-primary' :
                    'bg-kick-green'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-foreground">{activity.user}</span>
                      <span className="text-muted-foreground ml-1">{activity.action}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
          </Card>
        </div>

        {/* Live Chat Feed */}
        <div className="lg:col-span-1">
          <LiveChatFeed />
        </div>
      </div>
    </div>
  );
}