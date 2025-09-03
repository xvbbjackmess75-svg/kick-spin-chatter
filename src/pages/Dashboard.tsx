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
  Crown
} from "lucide-react";

interface DashboardParticipant {
  id: string;
  username: string;
  avatar?: string;
  isWinner?: boolean;
}

// Convert to RouletteWheel expected format
interface RouletteParticipant {
  id: number;
  username: string;
  avatar: string;
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
    // Check if message matches any active giveaway keywords
    const activeGiveaways = giveaways.filter(g => g.status === 'active');
    
    for (const giveaway of activeGiveaways) {
      // Extract keyword from description (format: "Channel: x, Keyword: y")
      const keywordMatch = giveaway.description?.match(/Keyword: (.+)/);
      if (!keywordMatch) continue;
      
      const keyword = keywordMatch[1].trim();
      
      if (message.content && message.content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`Keyword "${keyword}" detected from user: ${message.username}`);
        
        // Add participant to giveaway
        try {
          await supabase
            .from('giveaway_participants')
            .insert({
              giveaway_id: giveaway.id,
              kick_username: message.username,
              kick_user_id: message.userId?.toString() || message.username
            });

          // Update participant count
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
          // Ignore duplicate participant errors
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
          channel_id: null, // We'll store channel name in description for now
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

    // Simulate spinning duration
    setTimeout(async () => {
      const randomWinner = participants[Math.floor(Math.random() * participants.length)];
      setWinner({ ...randomWinner, isWinner: true });
      setIsSpinning(false);

      // Update giveaway with winner
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

  // Mock function to simulate adding participants (in real implementation, this would be done by chat bot)
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

      // Update participant count
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
        title: "New Participant",
        description: `${randomUsername} joined the giveaway!`,
      });
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green" />
      </div>
    );
  }

  const activeGiveaways = giveaways.filter(g => g.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Giveaways</h1>
          <p className="text-muted-foreground mt-1">
            Track chat messages and run giveaways for your Kick streams.
          </p>
        </div>
        
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
                <Input 
                  id="title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Gaming Headset Giveaway" 
                  className="bg-secondary/30" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Kick Channel Name</Label>
                <Input 
                  id="channel" 
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="your-channel-name" 
                  className="bg-secondary/30" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyword">Entry Keyword</Label>
                <Input 
                  id="keyword" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="!giveaway" 
                  className="bg-secondary/30" 
                />
                <p className="text-xs text-muted-foreground">
                  Viewers will type this in chat to enter
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="gaming-button flex-1" onClick={createGiveaway}>
                  Create & Start
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roulette Wheel */}
        <div className="lg:col-span-1">
          <Card className="gaming-card">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        </div>

        {/* Active Giveaways */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Active Giveaways</h2>
            <Badge variant="outline" className="text-kick-green border-kick-green/30">
              {activeGiveaways.length} running
            </Badge>
          </div>

          {activeGiveaways.length === 0 ? (
            <Card className="gaming-card">
              <CardContent className="p-8 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Active Giveaways</h3>
                <p className="text-muted-foreground mb-4">Create your first giveaway to get started!</p>
                <Button className="gaming-button" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Giveaway
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeGiveaways.map((giveaway) => (
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
                        <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">{giveaway.participants_count || 0}</div>
                          <div className="text-xs text-muted-foreground">Participants</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">Running</div>
                          <div className="text-xs text-muted-foreground">Status</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="gaming-button" 
                          onClick={() => drawWinner(giveaway)}
                          disabled={isSpinning}
                        >
                          <Zap className="h-3 w-3 mr-2" />
                          Pick Winner
                        </Button>
                        {!chatConnected ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const channelMatch = giveaway.description?.match(/Channel: ([^,]+)/);
                              if (channelMatch) {
                                joinChatChannel(channelMatch[1].trim());
                              }
                            }}
                          >
                            <Users className="h-3 w-3 mr-2" />
                            Start Monitoring
                          </Button>
                        ) : connectedChannel === giveaway.description?.match(/Channel: ([^,]+)/)?.[1]?.trim() ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-kick-green/20 text-kick-green border-kick-green/30"
                            disabled
                          >
                            <div className="w-2 h-2 bg-kick-green rounded-full animate-pulse mr-2" />
                            Monitoring Chat
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const channelMatch = giveaway.description?.match(/Channel: ([^,]+)/);
                              if (channelMatch) {
                                joinChatChannel(channelMatch[1].trim());
                              }
                            }}
                          >
                            <Users className="h-3 w-3 mr-2" />
                            Monitor This Channel
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => simulateParticipant(giveaway.id)}
                        >
                          <Users className="h-3 w-3 mr-2" />
                          + Test Participant
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Recent Participants */}
      {participants.length > 0 && (
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Participants ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {participants.slice(0, 10).map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors chat-message">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {participant.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{participant.username}</p>
                  <p className="text-xs text-muted-foreground">Entered giveaway</p>
                </div>
                <div className="w-2 h-2 bg-kick-green rounded-full animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}