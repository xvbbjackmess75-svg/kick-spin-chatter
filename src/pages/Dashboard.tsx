import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RouletteWheel } from "@/components/RouletteWheel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Gift, 
  Users,
  Trophy,
  Zap,
  Crown,
  Monitor,
  MonitorX,
  Play,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface DashboardParticipant {
  id: string;
  username: string;
  avatar?: string;
  isWinner?: boolean;
}

interface Giveaway {
  id: string;
  title: string;
  description?: string;
  status: string;
  participants_count: number;
  winner_user_id?: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<DashboardParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatConnected, setChatConnected] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<string>("");
  const socketRef = useRef<WebSocket | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (user) {
      fetchGiveaways();
      initializeWebSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  const fetchGiveaways = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiveaways(data || []);
    } catch (error) {
      console.error('Error fetching giveaways:', error);
      toast({
        title: "Error",
        description: "Failed to fetch giveaways",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeWebSocket = () => {
    try {
      socketRef.current = new WebSocket('wss://xdjtgkgwtsdpfftrrouz.functions.supabase.co/kick-chat-monitor');
      
      socketRef.current.onopen = () => {
        console.log('Connected to chat monitor');
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        switch (data.type) {
          case 'connected':
            setChatConnected(true);
            setConnectedChannel(data.channelName);
            toast({
              title: "Chat Connected",
              description: `Now monitoring ${data.channelName} chat for keywords`,
            });
            break;
            
          case 'chat_message':
            handleChatMessage(data.data);
            break;
            
          case 'disconnected':
            setChatConnected(false);
            setConnectedChannel("");
            break;
            
          case 'error':
            console.error('WebSocket error:', data.message);
            toast({
              title: "Connection Error",
              description: data.message,
              variant: "destructive"
            });
            break;
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error", 
          description: "Failed to connect to chat monitor",
          variant: "destructive"
        });
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setChatConnected(false);
        setConnectedChannel("");
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const handleChatMessage = async (message: any) => {
    const activeGiveaways = giveaways.filter(g => g.status === 'active');
    
    for (const giveaway of activeGiveaways) {
      const keywordMatch = giveaway.description?.match(/Keyword: (.+)/);
      if (!keywordMatch) continue;
      
      const keyword = keywordMatch[1].trim();
      
      if (message.content && message.content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`Keyword "${keyword}" detected from user: ${message.username}`);
        
        try {
          await supabase
            .from('giveaway_participants')
            .insert({
              giveaway_id: giveaway.id,
              kick_username: message.username,
              kick_user_id: message.userId?.toString() || message.username
            });

          const { data: participants } = await supabase
            .from('giveaway_participants')
            .select('id')
            .eq('giveaway_id', giveaway.id);

          await supabase
            .from('giveaways')
            .update({ participants_count: participants?.length || 0 })
            .eq('id', giveaway.id);

          fetchGiveaways();
          
          toast({
            title: "New Participant",
            description: `${message.username} entered "${giveaway.title}" giveaway!`,
          });
        } catch (error) {
          if (!error.message?.includes('duplicate')) {
            console.error('Error adding participant:', error);
          }
        }
      }
    }
  };

  const joinChatChannel = (channelName: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'join_channel',
        channelName: channelName
      }));
    }
  };

  const fetchParticipants = async (giveawayId: string) => {
    try {
      const { data, error } = await supabase
        .from('giveaway_participants')
        .select('*')
        .eq('giveaway_id', giveawayId);

      if (error) throw error;
      
      const formattedParticipants: DashboardParticipant[] = (data || []).map((p, index) => ({
        id: index.toString(),
        username: p.kick_username,
        avatar: undefined
      }));
      
      setParticipants(formattedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const createGiveaway = async () => {
    if (!title.trim() || !channelName.trim() || !keyword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('giveaways')
        .insert({
          title: title.trim(),
          channel_id: null,
          description: `Channel: ${channelName.trim()}, Keyword: ${keyword.trim()}`,
          user_id: user?.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Giveaway "${title}" created! Click "Start Monitoring" to track chat.`,
      });

      setTitle("");
      setChannelName("");
      setKeyword("");
      setIsCreateDialogOpen(false);
      fetchGiveaways();
    } catch (error) {
      console.error('Error creating giveaway:', error);
      toast({
        title: "Error",
        description: "Failed to create giveaway",
        variant: "destructive"
      });
    }
  };

  const drawWinner = async (giveaway: Giveaway) => {
    await fetchParticipants(giveaway.id);
    
    if (participants.length === 0) {
      toast({
        title: "No Participants",
        description: "This giveaway has no participants yet",
        variant: "destructive"
      });
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    setTimeout(async () => {
      const randomWinner = participants[Math.floor(Math.random() * participants.length)];
      setWinner({ ...randomWinner, isWinner: true });
      setIsSpinning(false);

      try {
        await supabase
          .from('giveaways')
          .update({ 
            winner_user_id: randomWinner.username,
            status: 'completed'
          })
          .eq('id', giveaway.id);

        toast({
          title: "Winner Selected!",
          description: `Congratulations to ${randomWinner.username}!`,
        });

        fetchGiveaways();
      } catch (error) {
        console.error('Error updating winner:', error);
      }
    }, 4000);
  };

  const simulateParticipant = async (giveawayId: string) => {
    const mockUsernames = ['StreamFan99', 'GamingQueen', 'BotLover', 'ChatMaster', 'NightOwl', 'ProGamer'];
    const randomUsername = mockUsernames[Math.floor(Math.random() * mockUsernames.length)] + Math.floor(Math.random() * 1000);

    try {
      await supabase
        .from('giveaway_participants')
        .insert({
          giveaway_id: giveawayId,
          kick_username: randomUsername,
          kick_user_id: randomUsername
        });

      const { data: participants } = await supabase
        .from('giveaway_participants')
        .select('id')
        .eq('giveaway_id', giveawayId);

      await supabase
        .from('giveaways')
        .update({ participants_count: participants?.length || 0 })
        .eq('id', giveawayId);

      fetchGiveaways();
      toast({
        title: "Test Participant Added",
        description: `${randomUsername} joined the giveaway!`,
      });
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeGiveaways = giveaways.filter(g => g.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Kick Giveaways
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitor Kick chat and run automated giveaways with real-time participant tracking
            </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
              {chatConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Monitoring: {connectedChannel}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="text-sm text-muted-foreground">Not monitoring chat</span>
                </>
              )}
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-5 w-5 mr-2" />
                  New Giveaway
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create New Giveaway</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Giveaway Title</Label>
                    <Input 
                      id="title" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Gaming Headset Giveaway" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channel">Kick Channel Name</Label>
                    <Input 
                      id="channel" 
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="e.g., robertgamba" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keyword">Entry Keyword</Label>
                    <Input 
                      id="keyword" 
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g., juice" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Viewers will type this keyword in chat to enter
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={createGiveaway} className="flex-1">
                      Create Giveaway
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Roulette Wheel */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Winner Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <RouletteWheel
                  participants={participants.map((p, index) => ({
                    id: index,
                    username: p.username,
                    avatar: p.avatar || '/placeholder-avatar.jpg',
                    isWinner: p.isWinner
                  }))}
                  isSpinning={isSpinning}
                  onSpin={() => {}}
                  winner={winner ? {
                    id: 0,
                    username: winner.username,
                    avatar: winner.avatar || '/placeholder-avatar.jpg',
                    isWinner: winner.isWinner
                  } : undefined}
                />
                
                {participants.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {participants.length} participant{participants.length !== 1 ? 's' : ''} ready for drawing
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Giveaways */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Active Giveaways</h2>
              <Badge variant="outline" className="text-primary border-primary/30">
                {activeGiveaways.length} running
              </Badge>
            </div>

            {activeGiveaways.length === 0 ? (
              <Card className="border-dashed border-muted-foreground/30">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Gift className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Giveaways</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Create your first giveaway to start engaging with your Kick audience!
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Giveaway
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeGiveaways.map((giveaway) => {
                  const channelMatch = giveaway.description?.match(/Channel: ([^,]+)/);
                  const keywordMatch = giveaway.description?.match(/Keyword: (.+)/);
                  const channel = channelMatch?.[1]?.trim();
                  const keyword = keywordMatch?.[1]?.trim();
                  const isMonitoring = chatConnected && connectedChannel === channel;

                  return (
                    <Card key={giveaway.id} className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          
                          {/* Giveaway Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <h3 className="text-xl font-semibold">{giveaway.title}</h3>
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                Active
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Channel:</span>
                                <span className="font-medium ml-2">{channel}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Keyword:</span>
                                <code className="font-mono bg-secondary px-2 py-1 rounded ml-2">{keyword}</code>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Participants:</span>
                                <span className="font-bold text-primary ml-2">{giveaway.participants_count || 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <div className="flex items-center gap-2 ml-2">
                                  {isMonitoring ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      <span className="text-green-600 font-medium">Monitoring</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-4 w-4 text-orange-500" />
                                      <span className="text-orange-600 font-medium">Waiting</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            {!isMonitoring ? (
                              <Button 
                                onClick={() => joinChatChannel(channel || '')}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                <Monitor className="h-4 w-4 mr-2" />
                                Start Monitoring
                              </Button>
                            ) : (
                              <Button 
                                variant="outline"
                                className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10"
                                disabled
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                                Monitoring Chat
                              </Button>
                            )}
                            
                            <Button 
                              onClick={() => drawWinner(giveaway)}
                              disabled={isSpinning || (giveaway.participants_count || 0) === 0}
                              className="w-full bg-gradient-to-r from-primary to-primary/80"
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              {isSpinning ? 'Drawing...' : 'Pick Winner'}
                            </Button>
                            
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => simulateParticipant(giveaway.id)}
                              className="w-full"
                            >
                              <Users className="h-3 w-3 mr-2" />
                              Add Test Participant
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Participants */}
        {participants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {participants.slice(0, 8).map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {participant.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{participant.username}</p>
                      <p className="text-xs text-muted-foreground">Participant</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}