import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Gift, 
  Play, 
  Pause, 
  Users,
  Trophy,
  Clock,
  Zap,
  Eye,
  Settings,
  Crown
} from "lucide-react";

const giveaways = [
  {
    id: 1,
    title: "Gaming Headset Giveaway",
    description: "Premium wireless gaming headset with RGB lighting",
    participants: 127,
    maxParticipants: 200,
    timeLeft: "5m 32s",
    status: "active",
    prize: "SteelSeries Arctis 7",
    image: "/placeholder-headset.jpg",
    entryCommand: "!enter",
    createdAt: "2 hours ago"
  },
  {
    id: 2,
    title: "Steam Gift Card",
    description: "$50 Steam Gift Card for any game you want!",
    participants: 89,
    maxParticipants: 150,
    timeLeft: "12m 18s",
    status: "active",
    prize: "$50 Steam Card",
    image: "/placeholder-steam.jpg",
    entryCommand: "!steam",
    createdAt: "1 hour ago"
  },
  {
    id: 3,
    title: "VIP Discord Role",
    description: "Exclusive VIP role with special perks and access",
    participants: 245,
    maxParticipants: 300,
    timeLeft: "25m 45s",
    status: "active",
    prize: "VIP Discord Role",
    image: "/placeholder-discord.jpg",
    entryCommand: "!vip",
    createdAt: "30 minutes ago"
  },
  {
    id: 4,
    title: "Gaming Mouse",
    description: "High-performance gaming mouse with 16000 DPI",
    participants: 456,
    maxParticipants: 500,
    timeLeft: "Ended",
    status: "completed",
    prize: "Razer DeathAdder V3",
    image: "/placeholder-mouse.jpg",
    entryCommand: "!mouse",
    createdAt: "1 day ago",
    winner: "GamerPro123"
  }
];

const recentParticipants = [
  { username: "StreamFan99", avatar: "/avatar1.jpg", joinedAt: "2s ago" },
  { username: "GamingQueen", avatar: "/avatar2.jpg", joinedAt: "15s ago" },
  { username: "BotLover", avatar: "/avatar3.jpg", joinedAt: "32s ago" },
  { username: "ChatMaster", avatar: "/avatar4.jpg", joinedAt: "1m ago" },
  { username: "NightOwl", avatar: "/avatar5.jpg", joinedAt: "2m ago" },
];

export default function Giveaways() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<any>(null);

  // Mock participants for roulette
  const mockParticipants = [
    { id: 1, username: "StreamFan99", avatar: "/avatar1.jpg" },
    { id: 2, username: "GamingQueen", avatar: "/avatar2.jpg" },
    { id: 3, username: "BotLover", avatar: "/avatar3.jpg" },
    { id: 4, username: "ChatMaster", avatar: "/avatar4.jpg" },
    { id: 5, username: "NightOwl", avatar: "/avatar5.jpg" },
    { id: 6, username: "ProGamer", avatar: "/avatar6.jpg" },
    { id: 7, username: "StreamLover", avatar: "/avatar7.jpg" },
    { id: 8, username: "GamerPro123", avatar: "/avatar8.jpg" },
  ];

  const handleSpin = () => {
    setIsSpinning(true);
    setWinner(null);
    
    // Simulate spinning duration
    setTimeout(() => {
      const randomWinner = mockParticipants[Math.floor(Math.random() * mockParticipants.length)];
      setWinner(randomWinner);
      setIsSpinning(false);
    }, 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-kick-green/20 text-kick-green border-kick-green/30";
      case "completed": return "bg-accent/20 text-accent border-accent/30";
      case "paused": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-secondary/20 text-secondary-foreground border-secondary/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Giveaways</h1>
          <p className="text-muted-foreground mt-1">
            Manage your stream giveaways and engage with your audience.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gaming-button">
                <Plus className="h-4 w-4 mr-2" />
                New Giveaway
              </Button>
            </DialogTrigger>
            <DialogContent className="gaming-card border-border/50 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Giveaway</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Giveaway Title</Label>
                  <Input id="title" placeholder="Gaming Headset Giveaway" className="bg-secondary/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the prize..." className="bg-secondary/30" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input id="maxParticipants" type="number" placeholder="200" className="bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input id="duration" type="number" placeholder="30" className="bg-secondary/30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryCommand">Entry Command</Label>
                  <Input id="entryCommand" placeholder="!enter" className="bg-secondary/30" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button className="gaming-button flex-1">Create & Start</Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roulette Wheel Placeholder */}
        <div className="lg:col-span-1">
          <Card className="gaming-card">
            <CardContent className="p-8 text-center">
              <div className="w-64 h-64 mx-auto bg-gradient-primary/10 rounded-full border-4 border-accent/30 flex items-center justify-center mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary/5 animate-spin-slow"></div>
                <Trophy className="h-16 w-16 text-accent animate-pulse relative z-10" />
              </div>
              
              {winner && !isSpinning && (
                <div className="mb-6 p-4 bg-gradient-primary/10 rounded-lg border border-accent/30">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-accent" />
                    <span className="text-lg font-bold text-foreground">Winner!</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {winner.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-accent">{winner.username}</span>
                  </div>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-foreground mb-2">Roulette Wheel</h3>
              <p className="text-muted-foreground mb-4">
                {mockParticipants.length} participants ready to win!
              </p>
              <Button 
                className="gaming-button" 
                onClick={handleSpin} 
                disabled={isSpinning}
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isSpinning ? "Spinning..." : "Draw Winner"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Giveaways */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Active Giveaways</h2>
            <Badge variant="outline" className="text-kick-green border-kick-green/30">
              {giveaways.filter(g => g.status === 'active').length} running
            </Badge>
          </div>

          {giveaways.slice(0, 3).map((giveaway) => (
            <Card key={giveaway.id} className="gaming-card hover:scale-[1.02] transition-transform duration-200">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Gift className="h-8 w-8 text-primary-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{giveaway.title}</h3>
                        <p className="text-sm text-muted-foreground">{giveaway.description}</p>
                      </div>
                      <Badge className={getStatusColor(giveaway.status)}>
                        {giveaway.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{giveaway.participants}</div>
                        <div className="text-xs text-muted-foreground">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{giveaway.timeLeft}</div>
                        <div className="text-xs text-muted-foreground">Time Left</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{giveaway.entryCommand}</div>
                        <div className="text-xs text-muted-foreground">Entry Command</div>
                      </div>
                    </div>
                    
                    {giveaway.status === 'active' && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground font-medium">
                            {giveaway.participants}/{giveaway.maxParticipants}
                          </span>
                        </div>
                        <Progress 
                          value={(giveaway.participants / giveaway.maxParticipants) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    {giveaway.winner && (
                      <div className="flex items-center gap-2 mb-4 p-2 bg-accent/10 rounded-lg">
                        <Trophy className="h-4 w-4 text-accent" />
                        <span className="text-sm text-foreground">
                          Winner: <span className="font-semibold text-accent">{giveaway.winner}</span>
                        </span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {giveaway.status === 'active' ? (
                        <>
                          <Button size="sm" className="gaming-button" onClick={handleSpin}>
                            <Zap className="h-3 w-3 mr-2" />
                            Draw Winner
                          </Button>
                          <Button size="sm" variant="outline">
                            <Pause className="h-3 w-3 mr-2" />
                            Pause
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-2" />
                          View Details
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Settings className="h-3 w-3 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Participants */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Participants */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentParticipants.map((participant, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors chat-message">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {participant.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{participant.username}</p>
                  <p className="text-xs text-muted-foreground">joined {participant.joinedAt}</p>
                </div>
                <div className="w-2 h-2 bg-kick-green rounded-full animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Giveaway Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Giveaways</span>
              <span className="font-semibold text-foreground">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Participants</span>
              <span className="font-semibold text-foreground">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Now</span>
              <span className="font-semibold text-kick-green">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. Participation</span>
              <span className="font-semibold text-foreground">156</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}