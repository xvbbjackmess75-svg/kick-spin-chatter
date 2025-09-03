import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { GiveawayRoulette } from "@/components/GiveawayRoulette";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useHybridAuth } from "@/hooks/useHybridAuth";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Gift, 
  Users,
  Trophy,
  Monitor,
  MonitorX,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  UserX,
  MoreVertical
} from "lucide-react";

interface RouletteParticipant {
  id: number;
  username: string;
  avatar?: string;
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

export default function Giveaways() {
  const { hybridUserId, isAuthenticated, isKickUser, isSupabaseUser, isGuestMode, loading: authLoading } = useHybridAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [participants, setParticipants] = useState<RouletteParticipant[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentGiveaway, setCurrentGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatConnected, setChatConnected] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<string>("");
  const socketRef = useRef<WebSocket | null>(null);
  
  // Management states
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [deleteGiveawayId, setDeleteGiveawayId] = useState<string | null>(null);
  const [clearParticipantsId, setClearParticipantsId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (isSupabaseUser) {
        fetchGiveaways();
        initializeWebSocket();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, isSupabaseUser]);

  const fetchGiveaways = async () => {
    if (!isSupabaseUser) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
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
              title: "✅ Chat Connected",
              description: `Now monitoring ${data.channelName} chat for keywords`,
            });
            console.log(`Connected to chat for channel: ${data.channelName}`);
            break;
            
          case 'chat_message':
            console.log('Received chat message:', data.data);
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

      socketRef.current.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        if (event.code === 1000) {
          setChatConnected(false);
          setConnectedChannel("");
        } else {
          console.log('Unexpected disconnect, attempting to reconnect...');
          setTimeout(() => {
            if (socketRef.current?.readyState !== WebSocket.OPEN) {
              initializeWebSocket();
            }
          }, 3000);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const handleChatMessage = async (message: any) => {
    console.log('Processing chat message:', message);
    
    if (!isSupabaseUser) return;
    
    // Check for commands first
    if (message.content && message.content.startsWith('!')) {
      await processCommand(message);
    }
    
    // Then check for giveaway keywords
    const { data: currentGiveaways, error } = await supabase
      .from('giveaways')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching current giveaways:', error);
      return;
    }

    const activeGiveaways = currentGiveaways || [];
    console.log('Active giveaways for keyword matching:', activeGiveaways);
    
    for (const giveaway of activeGiveaways) {
      const keywordMatch = giveaway.description?.match(/Keyword: (.+)/);
      if (!keywordMatch) {
        console.log('No keyword found in giveaway:', giveaway.description);
        continue;
      }
      
      const keyword = keywordMatch[1].trim();
      console.log(`Checking keyword "${keyword}" against message: "${message.content}"`);
      
      if (message.content && message.content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`✅ Keyword "${keyword}" detected from user: ${message.username}`);
        
        try {
          const { data: existingParticipant } = await supabase
            .from('giveaway_participants')
            .select('id')
            .eq('giveaway_id', giveaway.id)
            .eq('kick_username', message.username)
            .single();

          if (existingParticipant) {
            console.log(`User ${message.username} already participated in giveaway ${giveaway.title}`);
            continue;
          }

          const { error: insertError } = await supabase
            .from('giveaway_participants')
            .insert({
              giveaway_id: giveaway.id,
              kick_username: message.username,
              kick_user_id: message.userId?.toString() || message.username
            });

          if (insertError) {
            console.error('Error inserting participant:', insertError);
            continue;
          }

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
            title: "🎉 New Participant!",
            description: `${message.username} entered "${giveaway.title}" giveaway!`,
          });
          
          console.log(`✅ Successfully added ${message.username} to giveaway ${giveaway.title}`);
        } catch (error) {
          console.error('Error adding participant:', error);
        }
      } else {
        console.log(`❌ Keyword "${keyword}" not found in message: "${message.content}"`);
      }
    }
  };

  const processCommand = async (message: any) => {
    try {
      const commandText = message.content.split(' ')[0]; // Get the command part (!command)
      console.log(`🤖 Processing command: ${commandText} from ${message.username}`);

      // Get user level based on chat message (you might need to parse this from message metadata)
      const userLevel = message.badges?.includes('moderator') ? 'moderator' : 
                       message.badges?.includes('subscriber') ? 'subscriber' : 'viewer';

      // Get Kick token for sending responses
      const kickTokenData = localStorage.getItem('kick_token');
      const kickToken = kickTokenData ? JSON.parse(kickTokenData) : null;

      const response = await supabase.functions.invoke('kick-chat-api', {
        body: {
          action: 'process_command',
          command: commandText,
          user: {
            username: message.username,
            user_id: message.userId?.toString() || message.username,
            user_level: userLevel
          },
          channel_id: message.channelId || connectedChannel,
          token_info: kickToken
        }
      });

      console.log('Command processing response:', response);

      if (response.data?.success) {
        console.log(`✅ Command ${commandText} processed successfully`);
        
        // Show notification for successful command
        toast({
          title: "🤖 Command Executed",
          description: `${message.username} used ${commandText}`,
        });
      } else if (response.data?.error && response.data.error !== 'Command not found') {
        console.log(`❌ Command failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error processing command:', error);
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

  const stopChatMonitoring = () => {
    if (socketRef.current) {
      socketRef.current.close();
      setChatConnected(false);
      setConnectedChannel("");
      toast({
        title: "🛑 Chat Monitoring Stopped",
        description: "Chat monitoring has been manually stopped",
      });
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
          user_id: user?.id, // Use the current authenticated user ID
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

  // Start winner selection for a giveaway
  const startWinnerSelection = async (giveaway: Giveaway) => {
    try {
      const { data, error } = await supabase
        .from('giveaway_participants')
        .select('*')
        .eq('giveaway_id', giveaway.id);

      if (error) throw error;
      
      const giveawayParticipants: RouletteParticipant[] = (data || []).map((p, index) => ({
        id: index,
        username: p.kick_username,
        avatar: undefined
      }));
      
      if (giveawayParticipants.length === 0) {
        toast({
          title: "No Participants",
          description: "This giveaway has no participants yet",
          variant: "destructive"
        });
        return;
      }

      console.log("🎰 Starting winner selection for giveaway:", giveaway.title);
      console.log("👥 Participants:", giveawayParticipants.map(p => p.username));
      
      setCurrentGiveaway(giveaway);
      setParticipants(giveawayParticipants);
      
    } catch (error) {
      console.error('Error starting winner selection:', error);
      toast({
        title: "Error",
        description: "Failed to start winner selection",
        variant: "destructive"
      });
    }
  };

  // Handle winner acceptance
  const handleAcceptWinner = async (winner: RouletteParticipant, result: any) => {
    if (!currentGiveaway) return;

    console.log("🏆 ACCEPTING WINNER:", {
      giveaway: currentGiveaway.title,
      giveawayId: currentGiveaway.id,
      winner: winner.username,
      winningTicket: result.winningTicket,
      currentStatus: currentGiveaway.status
    });

    try {
      // Add winner to the giveaway_winners table (keeping giveaway active)
      const { data: winnerData, error: winnerError } = await supabase
        .from('giveaway_winners')
        .insert({
          giveaway_id: currentGiveaway.id,
          winner_username: winner.username,
          winning_ticket: result.winningTicket,
          total_tickets: result.totalTickets,
          tickets_per_participant: result.ticketsPerParticipant
        })
        .select();

      if (winnerError) {
        console.error("❌ Winner insert error:", winnerError);
        throw winnerError;
      }

      console.log("✅ Winner added successfully:", winnerData);

      toast({
        title: "Winner Added!",
        description: `${winner.username} has been added as a winner! You can add more winners or end the giveaway.`,
      });

      // Reset roulette for next winner selection
      setCurrentGiveaway(null);
      setParticipants([]);
      
      // Refresh giveaways to update the UI
      await fetchGiveaways();
      
      console.log("🔄 Dashboard refreshed, winner added to giveaway");
      
    } catch (error) {
      console.error('Error accepting winner:', error);
      toast({
        title: "Error",
        description: `Failed to accept winner: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleAddAnotherWinner = async () => {
    if (!currentGiveaway) return;
    
    try {
      // Fetch all participants for the giveaway
      const { data: participantsData, error: participantsError } = await supabase
        .from('giveaway_participants')
        .select('*')
        .eq('giveaway_id', currentGiveaway.id);

      if (participantsError) throw participantsError;

      // Fetch existing winners to exclude them
      const { data: winnersData, error: winnersError } = await supabase
        .from('giveaway_winners')
        .select('winner_username')
        .eq('giveaway_id', currentGiveaway.id);

      if (winnersError) throw winnersError;

      // Get list of usernames that have already won
      const previousWinners = winnersData.map(w => w.winner_username);
      
      // Filter out previous winners from participants
      const availableParticipants = participantsData.filter(
        p => !previousWinners.includes(p.kick_username)
      );

      if (availableParticipants.length === 0) {
        toast({
          title: "No More Participants",
          description: "All participants have already won!",
          variant: "destructive"
        });
        return;
      }

      const mappedParticipants: RouletteParticipant[] = availableParticipants.map((p, index) => ({
        id: index + 1,
        username: p.kick_username,
        avatar: `https://files.kick.com/images/user/${p.kick_username}/profile_image/conversion/300x300-medium.webp`
      }));

      console.log("🎯 Adding another winner - available participants:", mappedParticipants.length, "excluded:", previousWinners.length);
      
      setParticipants(mappedParticipants);
      
    } catch (error) {
      console.error('Error loading participants for another winner:', error);
      toast({
        title: "Error",
        description: "Failed to load participants for another winner",
        variant: "destructive"
      });
    }
  };

  const handleEndGiveaway = async () => {
    if (!currentGiveaway) return;

    try {
      // Mark giveaway as completed
      const { error } = await supabase
        .from('giveaways')
        .update({ status: 'completed' })
        .eq('id', currentGiveaway.id);

      if (error) throw error;

      toast({
        title: "Giveaway Ended!",
        description: "The giveaway has been marked as completed.",
      });

      setCurrentGiveaway(null);
      setParticipants([]);
      await fetchGiveaways();
      
    } catch (error) {
      console.error('Error ending giveaway:', error);
      toast({
        title: "Error", 
        description: "Failed to end giveaway",
        variant: "destructive"
      });
    }
  };

  // Handle winner reroll
  const handleRerollWinner = () => {
    console.log("🔄 Rerolling winner...");
    // The roulette component will handle the reroll internally
  };

  const simulateParticipant = async (giveawayId: string) => {
    try {
      const randomUsernames = [
        'StreamFan99', 'GamingKing', 'ChatMaster', 'ProGamer',
        'StreamQueen', 'GameLover', 'ChatBot', 'WinnerVibes',
        'LuckyPlayer', 'StreamViewer', 'KickFan', 'GamerPro'
      ];
      
      const randomUsername = randomUsernames[Math.floor(Math.random() * randomUsernames.length)];
      const timestamp = Date.now();
      const uniqueUsername = `${randomUsername}_${timestamp}`;
      
      const { error } = await supabase
        .from('giveaway_participants')
        .insert({
          giveaway_id: giveawayId,
          kick_username: uniqueUsername,
          kick_user_id: uniqueUsername
        });
      
      if (error) throw error;
      
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
        title: "Test Participant Added",
        description: `${uniqueUsername} joined the giveaway!`,
      });
      
    } catch (error) {
      console.error('Error adding test participant:', error);
      toast({
        title: "Error",
        description: "Failed to add test participant",
        variant: "destructive"
      });
    }
  };

  const updateGiveaway = async (giveawayId: string, newKeyword: string) => {
    if (!newKeyword.trim()) {
      toast({
        title: "Error",
        description: "Keyword cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      const currentGiveaway = giveaways.find(g => g.id === giveawayId);
      if (!currentGiveaway) return;

      // Extract channel from existing description
      const channelMatch = currentGiveaway.description?.match(/Channel: ([^,]+)/);
      const channel = channelMatch ? channelMatch[1] : 'Unknown';
      
      const newDescription = `Channel: ${channel}, Keyword: ${newKeyword.trim()}`;
      
      const { error } = await supabase
        .from('giveaways')
        .update({ description: newDescription })
        .eq('id', giveawayId);

      if (error) throw error;

      toast({
        title: "Giveaway Updated",
        description: `Keyword changed to "${newKeyword}"`,
      });

      setEditingGiveaway(null);
      setNewKeyword("");
      fetchGiveaways();
    } catch (error) {
      console.error('Error updating giveaway:', error);
      toast({
        title: "Error",
        description: "Failed to update giveaway",
        variant: "destructive"
      });
    }
  };

  const deleteGiveaway = async (giveawayId: string) => {
    try {
      // First delete all participants
      await supabase
        .from('giveaway_participants')
        .delete()
        .eq('giveaway_id', giveawayId);
      
      // Then delete all winners
      await supabase
        .from('giveaway_winners')
        .delete()
        .eq('giveaway_id', giveawayId);
      
      // Finally delete the giveaway
      const { error } = await supabase
        .from('giveaways')
        .delete()
        .eq('id', giveawayId);

      if (error) throw error;

      toast({
        title: "Giveaway Deleted",
        description: "Giveaway and all associated data have been removed",
      });

      setDeleteGiveawayId(null);
      fetchGiveaways();
    } catch (error) {
      console.error('Error deleting giveaway:', error);
      toast({
        title: "Error",
        description: "Failed to delete giveaway",
        variant: "destructive"
      });
    }
  };

  const clearParticipants = async (giveawayId: string) => {
    try {
      const { error } = await supabase
        .from('giveaway_participants')
        .delete()
        .eq('giveaway_id', giveawayId);

      if (error) throw error;

      // Update participant count to 0
      await supabase
        .from('giveaways')
        .update({ participants_count: 0 })
        .eq('id', giveawayId);

      toast({
        title: "Participants Cleared",
        description: "All participants have been removed from this giveaway",
      });

      setClearParticipantsId(null);
      fetchGiveaways();
    } catch (error) {
      console.error('Error clearing participants:', error);
      toast({
        title: "Error",
        description: "Failed to clear participants",
        variant: "destructive"
      });
    }
  };

  const extractChannel = (description?: string) => {
    if (!description) return 'Unknown';
    const match = description.match(/Channel: ([^,]+)/);
    return match ? match[1] : 'Unknown';
  };

  const extractKeyword = (description?: string) => {
    if (!description) return 'Unknown';
    const match = description.match(/Keyword: (.+)/);
    return match ? match[1] : 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green mx-auto" />
          <p className="text-muted-foreground">Loading giveaways...</p>
        </div>
      </div>
    );
  }

  // Guest mode - show demo/informational content (only if not authenticated)
  if (isGuestMode && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-12 bg-gradient-primary/10 rounded-xl border border-primary/20">
            <div className="max-w-2xl mx-auto px-6">
              <Gift className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-4">Giveaway Manager</h1>
              <p className="text-xl text-muted-foreground mb-6">
                This is where you'll manage your Kick.com giveaways with real-time chat integration.
              </p>
              <p className="text-muted-foreground mb-8">
                <strong>Guest Mode:</strong> You're viewing this as a guest. To create and manage real giveaways, 
                please sign up for an account or connect your Kick account.
              </p>
              <Button 
                className="gaming-button" 
                onClick={() => window.location.href = '/auth'}
              >
                Sign Up to Get Started
              </Button>
            </div>
          </div>

          {/* Demo Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="gaming-card">
              <CardContent className="p-6 text-center">
                <Monitor className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Chat Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your Kick chat for giveaway keywords and automatically add participants.
                </p>
              </CardContent>
            </Card>

            <Card className="gaming-card">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-kick-green mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Fair Winner Selection</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced roulette system ensures every participant has an equal chance to win.
                </p>
              </CardContent>
            </Card>

            <Card className="gaming-card">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Participant Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track participants, manage entries, and handle multiple winners per giveaway.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // This section is no longer needed since Kick users auto-get Supabase accounts
  // Keeping this comment for reference, but the security barrier is removed

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Giveaway Manager</h1>
            <p className="text-muted-foreground mt-1">
              Manage your Kick.com giveaways with real-time chat integration.
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${chatConnected ? 'bg-kick-green animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-muted-foreground">
                {chatConnected ? `Connected to ${connectedChannel}` : 'Chat Disconnected'}
              </span>
            </div>
            
            {chatConnected ? (
              <Button onClick={stopChatMonitoring} variant="outline" size="sm">
                <MonitorX className="h-4 w-4 mr-2" />
                Stop Monitoring
              </Button>
            ) : null}
            
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
                    <Label htmlFor="channelName">Kick Channel Name</Label>
                    <Input
                      id="channelName"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="mychannel"
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
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={createGiveaway} className="gaming-button flex-1">
                      Create Giveaway
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)} 
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Roulette Modal */}
        {currentGiveaway && participants.length > 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{currentGiveaway.title}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setCurrentGiveaway(null);
                      setParticipants([]);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <GiveawayRoulette
                  participants={participants}
                  onAcceptWinner={handleAcceptWinner}
                  onRerollWinner={handleRerollWinner}
                  onAddAnotherWinner={handleAddAnotherWinner}
                  onEndGiveaway={handleEndGiveaway}
                />
              </div>
            </div>
          </div>
        )}

        {/* Giveaways Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {giveaways.map((giveaway) => (
            <Card key={giveaway.id} className="gaming-card hover:scale-[1.02] transition-transform duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-foreground truncate">
                      {giveaway.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        className={`${
                          giveaway.status === 'active' 
                            ? 'bg-kick-green/20 text-kick-green border-kick-green/30' 
                            : 'bg-accent/20 text-accent border-accent/30'
                        }`}
                      >
                        {giveaway.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(giveaway.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="gaming-card border-border/50">
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingGiveaway(giveaway);
                          setNewKeyword(extractKeyword(giveaway.description));
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Keyword
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => simulateParticipant(giveaway.id)}
                        className="flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Add Test User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setClearParticipantsId(giveaway.id)}
                        className="flex items-center gap-2 text-yellow-400"
                      >
                        <UserX className="h-4 w-4" />
                        Clear Participants
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteGiveawayId(giveaway.id)}
                        className="flex items-center gap-2 text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Giveaway
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-kick-green">
                      {giveaway.participants_count || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Participants</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-accent">
                      {giveaway.status === 'active' ? (
                        <CheckCircle2 className="h-6 w-6 mx-auto" />
                      ) : (
                        <AlertCircle className="h-6 w-6 mx-auto" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Status</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Channel:</span>
                    <span className="font-medium text-foreground">
                      {extractChannel(giveaway.description)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Keyword:</span>
                    <span className="font-medium text-accent">
                      {extractKeyword(giveaway.description)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {giveaway.status === 'active' ? (
                    <>
                      <Button 
                        size="sm" 
                        className="gaming-button flex-1" 
                        onClick={() => startWinnerSelection(giveaway)}
                        disabled={!giveaway.participants_count || giveaway.participants_count === 0}
                      >
                        <Trophy className="h-3 w-3 mr-2" />
                        Pick Winner
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => joinChatChannel(extractChannel(giveaway.description))}
                      >
                        <Monitor className="h-3 w-3 mr-2" />
                        Monitor
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      <Trophy className="h-3 w-3 mr-2" />
                      Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {giveaways.length === 0 && (
          <Card className="gaming-card text-center py-12">
            <CardContent>
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Giveaways Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first giveaway to start engaging with your Kick.com audience!
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="gaming-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Giveaway
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Giveaway Dialog */}
        <Dialog open={!!editingGiveaway} onOpenChange={(open) => !open && setEditingGiveaway(null)}>
          <DialogContent className="gaming-card border-border/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Giveaway</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-keyword">Entry Keyword</Label>
                <Input
                  id="edit-keyword"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="!giveaway"
                  className="bg-secondary/30"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => editingGiveaway && updateGiveaway(editingGiveaway.id, newKeyword)} 
                  className="gaming-button flex-1"
                >
                  Update Giveaway
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingGiveaway(null)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteGiveawayId} onOpenChange={(open) => !open && setDeleteGiveawayId(null)}>
          <AlertDialogContent className="gaming-card border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete Giveaway</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete the giveaway and all associated data including participants and winners.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteGiveawayId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteGiveawayId && deleteGiveaway(deleteGiveawayId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Participants Confirmation Dialog */}
        <AlertDialog open={!!clearParticipantsId} onOpenChange={(open) => !open && setClearParticipantsId(null)}>
          <AlertDialogContent className="gaming-card border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Clear Participants</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will remove all participants from this giveaway. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClearParticipantsId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => clearParticipantsId && clearParticipants(clearParticipantsId)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}