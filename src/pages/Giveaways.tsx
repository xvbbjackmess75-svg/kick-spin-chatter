import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RouletteModal } from "@/components/RouletteModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useHybridAuth } from "@/hooks/useHybridAuth";
import { useAuth } from "@/hooks/useAuth";
import { useKickAccount } from "@/hooks/useKickAccount";
import { getBestAvatar } from "@/lib/avatarUtils";
import { KickAccountGuard } from "@/components/KickAccountGuard";
import { 
  Plus, 
  Gift, 
  Users,
  Trophy,
  Monitor,
  MonitorX,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  Trash2,
  Edit,
  UserX,
  MoreVertical,
  LogIn,
  MessageSquare,
  Clock,
  User
} from "lucide-react";

interface RouletteParticipant {
  id: number;
  username: string;
  avatar?: string;
  isVerified?: boolean;
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

interface PendingWinner {
  id: number;
  username: string;
  avatar?: string;
  winningTicket: number;
  totalTickets: number;
  ticketsPerParticipant: number;
  isVerified?: boolean;
}

export default function Giveaways() {
  const { hybridUserId, isAuthenticated, isKickUser, isSupabaseUser, loading: authLoading } = useHybridAuth();
  const { user } = useAuth();
  const { kickUser, kickToken, canUseChatbot, getChannelInfo } = useKickAccount();
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [participants, setParticipants] = useState<RouletteParticipant[]>([]);
  const [pendingWinners, setPendingWinners] = useState<PendingWinner[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentGiveaway, setCurrentGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatConnected, setChatConnected] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<string>("");
  const [isRouletteModalOpen, setIsRouletteModalOpen] = useState(false);
  const [isLiveChatModalOpen, setIsLiveChatModalOpen] = useState(false);
  const [liveParticipants, setLiveParticipants] = useState<Array<{
    username: string;
    timestamp: Date;
    keyword: string;
    isVerified: boolean;
  }>>([]);
  const [chatHistory, setChatHistory] = useState<Array<{
    username: string;
    message: string;
    timestamp: Date;
    userId?: string;
    badges?: string[];
  }>>([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState<{
    username: string;
    isVerified: boolean;
    profilePicture?: string;
    recentParticipations: Array<{
      giveawayTitle: string;
      channelName: string;
      joinedAt: Date;
      giveawayId: string;
    }>;
    totalGiveawayEntries: number;
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false); // WebSocket connection state
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Management states
  const [editingGiveaway, setEditingGiveaway] = useState<Giveaway | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [deleteGiveawayId, setDeleteGiveawayId] = useState<string | null>(null);
  const [clearParticipantsId, setClearParticipantsId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [channelName, setChannelName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [autoStartMonitoring, setAutoStartMonitoring] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [verifiedBonusChances, setVerifiedBonusChances] = useState(0);

  // Auto-populate user's channel when available
  useEffect(() => {
    const channelInfo = getChannelInfo();
    if (channelInfo && !channelName) {
      setChannelName(channelInfo.channelName);
    }
  }, [getChannelInfo, channelName]);

  useEffect(() => {
    console.log('🔄 Giveaways useEffect triggered:', {
      authLoading,
      canUseChatbot,
      isSupabaseUser,
      userId: user?.id
    });
    
    if (!authLoading && user?.id && isSupabaseUser) {
      console.log('✅ Conditions met, fetching giveaways...');
      fetchGiveaways();
      initializeWebSocket();
      restoreGiveawayMonitoringState(); // Restore persistent monitoring
    } else if (!authLoading) {
      console.log('❌ Conditions not met, setting loading to false');
      setLoading(false);
    }
  }, [authLoading, user?.id, isSupabaseUser]);

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
        socketRef.current = null;
      }
      setIsConnected(false);
      setChatConnected(false);
    };
  }, []);

  // Restore giveaway monitoring state on component mount
  const restoreGiveawayMonitoringState = () => {
    const savedMonitoringState = localStorage.getItem('giveaway_monitoring_state');
    if (savedMonitoringState) {
      const state = JSON.parse(savedMonitoringState);
      if (state.isActive && state.channelName) {
        console.log('🎉 Restoring giveaway monitoring for:', state.channelName);
        setTimeout(() => {
          joinChatChannel(state.channelName);
        }, 1000);
      }
    }
  };

  // Save giveaway monitoring state to localStorage
  const saveGiveawayMonitoringState = (isActive: boolean, channelName?: string) => {
    const state = {
      isActive,
      channelName: channelName || '',
      timestamp: Date.now()
    };
    localStorage.setItem('giveaway_monitoring_state', JSON.stringify(state));
  };

  const fetchGiveaways = async () => {
    // Only fetch giveaways for Supabase authenticated users
    if (!user?.id || !isSupabaseUser) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔍 Fetching giveaways for user:', user?.id);
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching giveaways:', error);
        throw error;
      }
      console.log('✅ Fetched giveaways:', data);
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

  // Load existing participants for active giveaways when restoring monitoring
  const loadExistingParticipants = async (channelName: string) => {
    if (!user?.id || !isSupabaseUser) return;
    
    try {
      console.log('🔄 Loading existing participants for channel:', channelName);
      
      // Find active giveaways for this channel
      const { data: activeGiveaways, error: giveawaysError } = await supabase
        .from('giveaways')
        .select('id, title, description')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (giveawaysError) {
        console.error('❌ Error fetching active giveaways:', giveawaysError);
        return;
      }

      if (!activeGiveaways || activeGiveaways.length === 0) {
        console.log('ℹ️ No active giveaways found');
        return;
      }

      // Filter giveaways by channel name
      const channelGiveaways = activeGiveaways.filter(giveaway => {
        const giveawayChannel = extractChannel(giveaway.description);
        return giveawayChannel === channelName;
      });

      if (channelGiveaways.length === 0) {
        console.log('ℹ️ No active giveaways for this channel');
        return;
      }

      // Load participants for all active giveaways in this channel
      const allParticipants = [];
      for (const giveaway of channelGiveaways) {
        const { data: participants, error: participantsError } = await supabase
          .from('giveaway_participants')
          .select('kick_username, entered_at, is_verified')
          .eq('giveaway_id', giveaway.id)
          .order('entered_at', { ascending: false });

        if (participantsError) {
          console.error('❌ Error fetching participants for giveaway:', giveaway.id, participantsError);
          continue;
        }

        if (participants && participants.length > 0) {
          const keyword = extractKeyword(giveaway.description);
          
          // Check real-time verification status for each participant
          for (const p of participants) {
            console.log(`🔍 Checking real-time verification for ${p.kick_username} in live chat...`);
            
            // Check if user has verified_viewer role instead of just linked accounts
            let profileData = await supabase
              .from('profiles')
              .select('user_id')
              .eq('linked_kick_username', p.kick_username)
              .maybeSingle();
            
            // If not found, try kick_username field
            if (!profileData.data) {
              profileData = await supabase
                .from('profiles')
                .select('user_id')
                .eq('kick_username', p.kick_username)
                .maybeSingle();
            }
            
            let isVerified = false;
            if (profileData.data?.user_id) {
              const { data: roleData } = await supabase
                .rpc('get_user_role', { _user_id: profileData.data.user_id });
              isVerified = roleData === 'verified_viewer';
            }
            
            console.log(`✅ ${p.kick_username} live chat verification: ${isVerified} (Role check for user_id: ${profileData.data?.user_id})`);
            
            allParticipants.push({
              username: p.kick_username,
              timestamp: new Date(p.entered_at),
              keyword: keyword,
              isVerified: isVerified
            });
          }
        }
      }

      if (allParticipants.length > 0) {
        console.log(`✅ Loaded ${allParticipants.length} existing participants into live chat activity`);
        setLiveParticipants(allParticipants);
      }
      
    } catch (error) {
      console.error('❌ Error loading existing participants:', error);
    }
  };

  const initializeWebSocket = () => {
    try {
      console.log('🔗 Initializing WebSocket connection to chat monitor...');
      
      // Close existing connection if any
      if (socketRef.current) {
        console.log('🔄 Closing existing WebSocket connection');
        socketRef.current.close();
        socketRef.current = null;
      }
      
      socketRef.current = new WebSocket('wss://xdjtgkgwtsdpfftrrouz.functions.supabase.co/kick-chat-monitor');
      
      socketRef.current.onopen = () => {
        console.log('✅ Connected to chat monitor WebSocket');
        setIsConnected(true);
        setReconnectAttempts(0); // Reset reconnection attempts on successful connection
        
        // Start heartbeat to keep connection alive
        const startHeartbeat = () => {
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
          }
          heartbeatTimeoutRef.current = setTimeout(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({ type: 'ping' }));
              startHeartbeat(); // Schedule next heartbeat
            }
          }, 30000); // Send ping every 30 seconds
        };
        startHeartbeat();
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        // Handle heartbeat response
        if (data.type === 'pong') {
          console.log('🟢 Heartbeat received');
          return;
        }

        switch (data.type) {
          case 'connected':
            setChatConnected(true);
            setConnectedChannel(data.channelName);
            // Only reset participants if this is a new monitoring session (not a reconnect/reopen)
            if (!chatConnected) {
              setLiveParticipants([]); // Reset participants list only for new sessions
              setIsLiveChatModalOpen(true); // Open live chat modal when monitoring starts
              
              // Load existing participants for active giveaways into live chat activity
              loadExistingParticipants(data.channelName);
              
              // Also refresh verification status to show updated badges
              if (currentGiveaway?.id) {
                refreshVerificationStatus(currentGiveaway.id);
              }
            }
            saveGiveawayMonitoringState(true, data.channelName); // Save persistent state
            toast({
              title: "✅ Chat Connected",
              description: `Now monitoring ${data.channelName} chat for keywords`,
            });
            console.log(`Connected to chat for channel: ${data.channelName}`);
            break;
            
          case 'chat_message':
            console.log('Received chat message:', data.data);
            // Store all chat messages for user activity tracking
            const chatMessage = {
              username: data.data.username,
              message: data.data.content || '',
              timestamp: new Date(),
              userId: data.data.userId?.toString(),
              badges: data.data.badges || []
            };
            setChatHistory(prev => [chatMessage, ...prev].slice(0, 100)); // Keep last 100 messages
            
            handleChatMessage(data.data);
            break;
            
          case 'disconnected':
            setChatConnected(false);
            setConnectedChannel("");
            setIsLiveChatModalOpen(false); // Close live chat modal when disconnected
            setChatHistory([]); // Clear chat history when disconnected
            saveGiveawayMonitoringState(false); // Clear persistent state
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
        console.log(`🔌 WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason || 'Unknown'}`);
        setIsConnected(false);
        setChatConnected(false);
        setConnectedChannel("");
        
        // Only attempt reconnect on unexpected disconnections
        if (event.code !== 1000 && event.code !== 1001) {
          console.log(`🔄 Unexpected disconnect (code: ${event.code}), attempting to reconnect in 3 seconds...`);
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => {
              const newAttempts = prev + 1;
              console.log(`🔄 Attempting WebSocket reconnection... (attempt ${newAttempts}/5)`);
              
              if (newAttempts < 5) {
                initializeWebSocket();
              } else {
                console.error('❌ Max reconnection attempts reached');
                toast({
                  title: "Connection Failed",
                  description: "Unable to maintain connection to chat monitor. Please refresh the page.",
                  variant: "destructive"
                });
              }
              
              return newAttempts;
            });
          }, Math.min(3000 * Math.pow(2, reconnectAttempts), 30000)); // Exponential backoff with max 30s
        }
      };
    } catch (error) {
      console.error('❌ Error initializing WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleChatMessage = async (message: any) => {
    console.log('🔍 Processing chat message:', {
      username: message.username,
      content: message.content,
      timestamp: new Date().toISOString(),
      userId: message.userId,
      badges: message.badges
    });
    
    if (!isSupabaseUser) {
      console.log('❌ Not a Supabase user, skipping message processing');
      return;
    }
    
    // Check for commands first
    if (message.content && message.content.startsWith('!')) {
      console.log('🤖 Command detected, processing...');
      await processCommand(message);
    }
    
    // Then check for giveaway keywords
    console.log('🎯 Checking for giveaway keywords...');
    const { data: currentGiveaways, error } = await supabase
      .from('giveaways')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('❌ Error fetching current giveaways:', error);
      return;
    }

    const activeGiveaways = currentGiveaways || [];
    console.log(`📋 Found ${activeGiveaways.length} active giveaways for keyword matching:`, activeGiveaways.map(g => ({ id: g.id, title: g.title, description: g.description })));
    
    for (const giveaway of activeGiveaways) {
      const keywordMatch = giveaway.description?.match(/Keyword: (.+)/);
      if (!keywordMatch) {
        console.log('No keyword found in giveaway:', giveaway.description);
        continue;
      }
      
      const keyword = keywordMatch[1].trim();
      console.log(`🔍 Checking keyword "${keyword}" against message: "${message.content}" from user: ${message.username}`);
      
      if (message.content && message.content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`✅ KEYWORD MATCH! "${keyword}" detected from user: ${message.username}`);
        
        // Check if giveaway requires verification
        let userIsVerified = false;
        if (giveaway.verified_only) {
          console.log(`🔍 Checking verification status for ${message.username} (verified_only giveaway)`);
          
          // Check if user has verified_viewer role
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('linked_kick_username', message.username)
            .maybeSingle();
          
          if (profileData?.user_id) {
            const { data: roleData } = await supabase
              .rpc('get_user_role', { _user_id: profileData.user_id });
            userIsVerified = roleData === 'verified_viewer';
          }
          
          if (!userIsVerified) {
            console.log(`❌ User ${message.username} is not verified - skipping entry for verified-only giveaway`);
            continue;
          }
          
          console.log(`✅ User ${message.username} is verified - allowing entry`);
        } else {
          // Even if giveaway doesn't require verification, we still want to check and store the user's verification status
          console.log(`🔍 Checking verification status for ${message.username} (for display purposes)`);
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('linked_kick_username', message.username)
            .maybeSingle();
          
          if (profileData?.user_id) {
            const { data: roleData } = await supabase
              .rpc('get_user_role', { _user_id: profileData.user_id });
            userIsVerified = roleData === 'verified_viewer';
          }
          
          console.log(`🔍 User ${message.username} verification status: ${userIsVerified} (Role check)`);
        }
        
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
              kick_user_id: message.userId?.toString() || message.username,
              is_verified: userIsVerified
            });

          if (insertError) {
            console.error('Error inserting participant:', insertError);
            continue;
          }

          const { data: participantsData } = await supabase
            .from('giveaway_participants')
            .select('id')
            .eq('giveaway_id', giveaway.id);

          await supabase
            .from('giveaways')
            .update({ participants_count: participantsData?.length || 0 })
            .eq('id', giveaway.id);

          fetchGiveaways();
          
          // Add to live participants list
          const newParticipant = {
            username: message.username,
            timestamp: new Date(),
            keyword: keyword,
            isVerified: userIsVerified
          };
          setLiveParticipants(prev => [newParticipant, ...prev].slice(0, 50)); // Keep last 50 participants
          
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

      const channelInfo = getChannelInfo();
      
      if (!channelInfo || !kickToken) {
        console.log('❌ No channel info or token available for command processing');
        return;
      }

      const response = await supabase.functions.invoke('kick-chat-api', {
        body: {
          action: 'process_command',
          command: commandText,
          user: {
            username: message.username,
            user_id: message.userId?.toString() || message.username,
            user_level: userLevel
          },
          channel_id: channelInfo.channelId,
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

  const joinChatChannel = (channelName?: string) => {
    const channelInfo = getChannelInfo();
    const targetChannel = channelName || channelInfo?.channelName;
    
    console.log('🚀 Attempting to join chat channel:', {
      requestedChannel: channelName,
      channelInfo,
      targetChannel,
      socketStatus: socketRef.current?.readyState
    });
    
    if (!targetChannel) {
      console.log('❌ No target channel available');
      toast({
        title: "Error",
        description: "No channel information available",
        variant: "destructive"
      });
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log(`📡 Sending join_channel request for: ${targetChannel}`);
      socketRef.current.send(JSON.stringify({
        type: 'join_channel',
        channelName: targetChannel
      }));
    } else {
      console.log('❌ WebSocket not connected, current state:', socketRef.current?.readyState);
      toast({
        title: "Connection Error",
        description: "WebSocket not connected. Try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  const viewUserProfile = async (username: string) => {
    try {
      // Always check current verification status using verified_viewer role
      console.log(`🔍 Checking real-time verification status for ${username}...`);
      
      // Get user_id first from profiles - try linked_kick_username first, then kick_username
      let profileData = await supabase
        .from('profiles')
        .select('user_id')
        .eq('linked_kick_username', username)
        .maybeSingle();
      
      // If not found, try kick_username field
      if (!profileData.data) {
        profileData = await supabase
          .from('profiles')
          .select('user_id')
          .eq('kick_username', username)
          .maybeSingle();
      }
      
      console.log(`🔧 Debug: Profile lookup for ${username}:`, profileData);
      
      let isVerified = false;
      if (profileData.data?.user_id) {
        const { data: roleData } = await supabase
          .rpc('get_user_role', { _user_id: profileData.data.user_id });
        isVerified = roleData === 'verified_viewer';
      }
      
      console.log(`✅ ${username} verification status: ${isVerified} (Role: ${isVerified ? 'verified_viewer' : 'viewer'}, User ID: ${profileData.data?.user_id})`);

      // Fetch user's recent giveaway participations
      const { data: participations, error } = await supabase
        .from('giveaway_participants')
        .select(`
          entered_at,
          giveaway_id,
          giveaways!inner(
            title,
            description,
            created_at
          )
        `)
        .eq('kick_username', username)
        .order('entered_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching user participations:', error);
      }

      // Extract channel names from giveaway descriptions and format participation data
      const recentParticipations = (participations || []).map(p => {
        const channelMatch = p.giveaways.description?.match(/Channel: (\w+)/);
        return {
          giveawayTitle: p.giveaways.title,
          channelName: channelMatch ? channelMatch[1] : 'Unknown',
          joinedAt: new Date(p.entered_at),
          giveawayId: p.giveaway_id
        };
      });

      // Try to get user's profile picture from Kick API or use initials
      let profilePicture = undefined;
      try {
        const kickResponse = await fetch(`https://kick.com/api/v2/channels/${username}`);
        if (kickResponse.ok) {
          const kickData = await kickResponse.json();
          profilePicture = kickData.user?.profile_pic;
        }
      } catch (error) {
        console.log('Could not fetch profile picture from Kick');
      }

      setSelectedUserProfile({
        username,
        isVerified,
        profilePicture,
        recentParticipations,
        totalGiveawayEntries: participations?.length || 0
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive"
      });
    }
  };

  const stopChatMonitoring = () => {
    if (socketRef.current) {
      socketRef.current.close();
      setChatConnected(false);
      setConnectedChannel("");
      setIsLiveChatModalOpen(false); // Close live chat modal when manually stopped
      setChatHistory([]); // Clear chat history when stopped
      setSelectedUserProfile(null); // Close user profile modal
      saveGiveawayMonitoringState(false); // Clear persistent state
      toast({
        title: "🛑 Chat Monitoring Stopped",
        description: "Giveaway chat monitoring has been manually stopped",
      });
    }
  };

  const createGiveaway = async () => {
    const channelInfo = getChannelInfo();
    
    if (!title.trim() || !channelName.trim() || !keyword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Use the user's own channel if no channel specified, or validate they own the specified channel
    const targetChannel = channelInfo?.channelName || channelName.trim();
    
    if (channelInfo && channelName.trim() !== channelInfo.channelName) {
      toast({
        title: "Error",
        description: `You can only create giveaways for your own channel (@${channelInfo.channelName})`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Only allow Supabase authenticated users to create giveaways
      if (!user?.id || !isSupabaseUser) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in with a Supabase account to create giveaways. Please sign up or log in.",
          variant: "destructive"
        });
        return;
      }

      console.log('Creating giveaway with user ID:', user.id);
      console.log('Channel info:', channelInfo);

      const { data, error } = await supabase
        .from('giveaways')
        .insert({
          title: title.trim(),
          channel_id: null, // Don't use channelInfo.channelId as it may not be a proper UUID
          description: `Channel: ${targetChannel}, Keyword: ${keyword.trim()}`,
          user_id: user.id,
          status: 'active',
          verified_only: verifiedOnly,
          verified_bonus_chances: verifiedBonusChances
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-start monitoring if checkbox was checked
      if (autoStartMonitoring) {
        // Initialize WebSocket if not already connected
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          initializeWebSocket();
        }
        
        // Join the chat channel after WebSocket is ready
        setTimeout(() => {
          joinChatChannel(targetChannel);
        }, 1000); // Give WebSocket time to connect
      }

      const successMessage = autoStartMonitoring 
        ? `Giveaway "${title}" created and monitoring started!`
        : `Giveaway "${title}" created for your channel! Click "Start Monitoring" to track chat.`;

      toast({
        title: "Success",
        description: successMessage,
      });

      setTitle("");
      setChannelName("");
      setKeyword("");
      setAutoStartMonitoring(false);
      setVerifiedOnly(false);
      setVerifiedBonusChances(0);
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
      console.log('🎯 Starting winner selection for giveaway:', giveaway.id);
      console.log('📊 Fetching fresh participants from database...');
      
      // Always fetch fresh participants data from the database
      const { data, error } = await supabase
        .from('giveaway_participants')
        .select('*')
        .eq('giveaway_id', giveaway.id)
        .order('entered_at', { ascending: true }); // Order by entry time for consistency

      if (error) {
        console.error('❌ Error fetching participants:', error);
        throw error;
      }
      
      console.log(`✅ Found ${data?.length || 0} participants in database for giveaway ${giveaway.id}`);
      
      // Fetch verification status for each participant
      const participantsWithVerification = await Promise.all(
        (data || []).map(async (p, index) => {
          // Check verification status using verified_viewer role + get custom avatar
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, custom_avatar_url')
            .eq('linked_kick_username', p.kick_username)
            .maybeSingle();
          
          let isVerified = false;
          if (profileData?.user_id) {
            const { data: roleData } = await supabase
              .rpc('get_user_role', { _user_id: profileData.user_id });
            isVerified = roleData === 'verified_viewer';
          }
          
          // Use avatar utility to get best available avatar
          const avatar = getBestAvatar({
            customAvatar: profileData?.custom_avatar_url,
            kickUsername: p.kick_username
          });
          
          return {
            id: index,
            username: p.kick_username,
            avatar,
            isVerified
          };
        })
      );
      
      const giveawayParticipants: RouletteParticipant[] = participantsWithVerification;
      
      console.log('🎯 Giveaway participants with avatars:', giveawayParticipants.slice(0, 3));
      
      if (giveawayParticipants.length === 0) {
        console.log('❌ No participants found for giveaway:', giveaway.id);
        toast({
          title: "No Participants",
          description: "This giveaway has no participants yet. Please wait for users to join.",
          variant: "destructive"
        });
        return;
      }

      console.log("🎰 Starting winner selection for giveaway:", giveaway.title);
      console.log("👥 Participants fetched:", giveawayParticipants.map(p => p.username));
      console.log("📊 Setting participants state:", giveawayParticipants.length);
      
      // Check if we have saved state for this specific giveaway in database
      console.log("🔍 Checking for saved state for giveaway:", giveaway.id);
      try {
        const { data: savedState, error } = await supabase
          .from('giveaway_states')
          .select('*')
          .eq('giveaway_id', giveaway.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("❌ Error fetching saved state:", error);
        } else {
          console.log("📊 Saved state query result:", savedState);
        }
        
        if (savedState && savedState.pending_winners) {
          const pendingWinnersData = typeof savedState.pending_winners === 'string' 
            ? JSON.parse(savedState.pending_winners) 
            : savedState.pending_winners;
          const remainingParticipantsData = typeof savedState.remaining_participants === 'string' 
            ? JSON.parse(savedState.remaining_participants) 
            : savedState.remaining_participants;
          
          if (Array.isArray(pendingWinnersData) && pendingWinnersData.length > 0) {
            console.log("🔄 Restoring saved state for giveaway:", giveaway.id, {
              pendingWinners: pendingWinnersData.length,
              remainingParticipants: Array.isArray(remainingParticipantsData) ? remainingParticipantsData.length : 0
            });
            setParticipants(remainingParticipantsData as RouletteParticipant[]);
            setPendingWinners(pendingWinnersData as PendingWinner[]);
          } else {
            console.log("🆕 Fresh start for giveaway (no pending winners):", giveaway.id);
            setParticipants(giveawayParticipants);
            setPendingWinners([]);
          }
        } else {
          console.log("🆕 Fresh start for giveaway (no saved state):", giveaway.id);
          setParticipants(giveawayParticipants);
          setPendingWinners([]);
        }
      } catch (error) {
        console.log("🆕 No saved state found, fresh start for giveaway:", giveaway.id);
        setParticipants(giveawayParticipants);
        setPendingWinners([]);
      }
      
      setCurrentGiveaway(giveaway);
      console.log("🎪 Opening roulette modal...");
      setIsRouletteModalOpen(true);
      
    } catch (error) {
      console.error('Error starting winner selection:', error);
      toast({
        title: "Error",
        description: "Failed to start winner selection",
        variant: "destructive"
      });
    }
  };

  // Handle pending winner from roulette
  const handlePendingWinner = (winner: RouletteParticipant, result: any) => {
    console.log("🏆 PENDING WINNER:", {
      giveaway: currentGiveaway?.title,
      winner: winner.username,
      winningTicket: result.winningTicket
    });

    const pendingWinner: PendingWinner = {
      id: Date.now() + Math.random(), // Temporary ID
      username: winner.username,
      avatar: winner.avatar,
      winningTicket: result.winningTicket,
      totalTickets: result.totalTickets,
      ticketsPerParticipant: result.ticketsPerParticipant,
      isVerified: winner.isVerified
    };

    setPendingWinners(prev => [...prev, pendingWinner]);
    
    // Winner is now pending
    
    toast({
      title: "Winner Added to Pending!",
      description: `${winner.username} is now pending. Add more winners or accept all to finish.`,
    });
  };

  // Remove a pending winner
  const handleRemovePendingWinner = (winnerId: number) => {
    setPendingWinners(prev => prev.filter(w => w.id !== winnerId));
    toast({
      title: "Winner Removed",
      description: "Winner removed from pending list",
    });
  };

  // Accept all pending winners and end giveaway
  const handleAcceptAllWinners = async () => {
    if (!currentGiveaway || pendingWinners.length === 0) {
      console.log("❌ Cannot accept winners:", {
        hasCurrentGiveaway: !!currentGiveaway,
        pendingWinnersCount: pendingWinners.length
      });
      return;
    }

    console.log("🏆 ACCEPTING ALL WINNERS:", {
      giveaway: currentGiveaway.title,
      giveawayId: currentGiveaway.id,
      pendingWinners: pendingWinners.map(w => ({
        username: w.username,
        winningTicket: w.winningTicket,
        totalTickets: w.totalTickets
      }))
    });

    try {
      // Insert all pending winners into the database
      const winnersToInsert = pendingWinners.map(winner => ({
        giveaway_id: currentGiveaway.id,
        winner_username: winner.username,
        winning_ticket: winner.winningTicket,
        total_tickets: winner.totalTickets,
        tickets_per_participant: winner.ticketsPerParticipant
      }));

      console.log("💾 Inserting winners into database:", winnersToInsert);

      const { error: winnersError } = await supabase
        .from('giveaway_winners')
        .insert(winnersToInsert);

      if (winnersError) {
        console.error("❌ Error inserting winners:", winnersError);
        throw winnersError;
      }

      console.log("✅ Winners inserted successfully");

      // Mark giveaway as completed
      console.log("🔄 Updating giveaway status to completed...");
      const { error: giveawayError } = await supabase
        .from('giveaways')
        .update({ status: 'completed' })
        .eq('id', currentGiveaway.id);

      if (giveawayError) {
        console.error("❌ Error updating giveaway status:", giveawayError);
        throw giveawayError;
      }

      console.log("✅ Giveaway status updated successfully");

      toast({
        title: "Giveaway Completed!",
        description: `${pendingWinners.length} winners have been saved and the giveaway is now completed.`,
      });

      // Reset all states after successful save
      setCurrentGiveaway(null);
      setParticipants([]);
      setPendingWinners([]);
      
      // Clear saved state for this giveaway since it's completed
      if (currentGiveaway) {
        try {
          await supabase
            .from('giveaway_states')
            .delete()
            .eq('giveaway_id', currentGiveaway.id)
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Error clearing giveaway state:', error);
        }
      }
      
      // Refresh giveaways list
      console.log("🔄 Refreshing giveaways list...");
      await fetchGiveaways();
      
    } catch (error) {
      console.error('Error accepting all winners:', error);
      toast({
        title: "Error",
        description: `Failed to accept winners: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Add another winner - reset roulette but exclude previous winners
  const handleAddAnotherWinner = async () => {
    if (!currentGiveaway) return;
    
    try {
      // Fetch all participants for the giveaway
      const { data: participantsData, error: participantsError } = await supabase
        .from('giveaway_participants')
        .select('*')
        .eq('giveaway_id', currentGiveaway.id);

      if (participantsError) throw participantsError;

      // Get list of usernames that have already won (from pending winners)
      const previousWinners = pendingWinners.map(w => w.username);
      
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

      const mappedParticipants: RouletteParticipant[] = await Promise.all(
        availableParticipants.map(async (p, index) => {
          // Check verification status using verified_viewer role + get custom avatar
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, custom_avatar_url')
            .eq('linked_kick_username', p.kick_username)
            .maybeSingle();
          
          let isVerified = false;
          if (profileData?.user_id) {
            const { data: roleData } = await supabase
              .rpc('get_user_role', { _user_id: profileData.user_id });
            isVerified = roleData === 'verified_viewer';
          }
          
          // Use avatar utility to get best available avatar
          const avatar = getBestAvatar({
            customAvatar: profileData?.custom_avatar_url,
            kickUsername: p.kick_username
          });
          
          return {
            id: index + 1,
            username: p.kick_username,
            avatar,
            isVerified
          };
        })
      );

      console.log("🎯 Adding another winner - available participants:", mappedParticipants.length, "excluded:", previousWinners.length);
      
      setParticipants(mappedParticipants);
      // Participants ready for next roll
      
    } catch (error) {
      console.error('Error loading participants for another winner:', error);
      toast({
        title: "Error",
        description: "Failed to load participants for another winner",
        variant: "destructive"
      });
    }
  };

  // Start new roll (triggered by button)
  const handleStartNewRoll = () => {
    console.log("🎲 Starting new roll...");
    // Modal handles the roll logic
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

  // Handle saving pending winners when modal closes
  const handleSavePendingWinners = async (winners: PendingWinner[], remainingParticipants: RouletteParticipant[]) => {
    if (!currentGiveaway || !user) return;
    
    console.log("💾 Saving pending winners for giveaway:", currentGiveaway.id, {
      winners: winners.length,
      remainingParticipants: remainingParticipants.length,
      winnerNames: winners.map(w => w.username)
    });
    
    try {
      // Save state to database
      const { error } = await supabase
        .from('giveaway_states')
        .upsert({
          giveaway_id: currentGiveaway.id,
          user_id: user.id,
          pending_winners: JSON.stringify(winners),
          remaining_participants: JSON.stringify(remainingParticipants)
        }, {
          onConflict: 'giveaway_id,user_id'
        });
      
      if (error) {
        console.error('❌ Error saving giveaway state:', error);
        toast({
          title: "Error",
          description: "Failed to save giveaway state",
          variant: "destructive"
        });
      } else {
        console.log('✅ Successfully saved giveaway state to database');
      }
    } catch (error) {
      console.error('Error saving giveaway state:', error);
    }
    
    // Update current state as well
    setPendingWinners(winners);
    setParticipants(remainingParticipants);
  };

  // Handle winner reroll (clears current pending winner)
  const handleRerollWinner = () => {
    console.log("🔄 Rerolling winner...");
    // Remove the last pending winner if any
    if (pendingWinners.length > 0) {
      setPendingWinners(prev => prev.slice(0, -1));
    }
    // Roulette component will handle the actual reroll
  };

  const simulateParticipant = async (giveawayId: string) => {
    try {
      // First check if this giveaway requires verification
      const { data: giveawayData } = await supabase
        .from('giveaways')
        .select('verified_only, title')
        .eq('id', giveawayId)
        .single();
      
      if (giveawayData?.verified_only) {
        toast({
          title: "Cannot Add Test Participant",
          description: "This giveaway requires verified users only. Test participants are not verified.",
          variant: "destructive"
        });
        return;
      }
      
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
          kick_user_id: uniqueUsername,
          is_verified: false
        });
      
      if (error) throw error;
      
      // Update participant count
      const { data: participantsData } = await supabase
        .from('giveaway_participants')
        .select('id')
        .eq('giveaway_id', giveawayId);
      
      await supabase
        .from('giveaways')
        .update({ participants_count: participantsData?.length || 0 })
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

  // Function to refresh verification status for existing participants
  const refreshVerificationStatus = async (giveawayId: string) => {
    try {
      console.log('🔄 Refreshing verification status for existing participants...');
      
      // Get all participants for this giveaway
      const { data: participants, error } = await supabase
        .from('giveaway_participants')
        .select('id, kick_username')
        .eq('giveaway_id', giveawayId);

      if (error) {
        console.error('❌ Error fetching participants:', error);
        return;
      }

      if (!participants || participants.length === 0) {
        console.log('ℹ️ No participants to update');
        return;
      }

      // Check verification status for each participant using verified_viewer role
      for (const participant of participants) {
        // Get user_id first - try linked_kick_username first, then kick_username
        console.log(`🔧 Debug: Looking up profile for ${participant.kick_username}`);
        let profileData = await supabase
          .from('profiles')
          .select('user_id, linked_kick_username, kick_username')
          .eq('linked_kick_username', participant.kick_username)
          .maybeSingle();
        
        // If not found, try kick_username field
        if (!profileData.data) {
          profileData = await supabase
            .from('profiles')
            .select('user_id, linked_kick_username, kick_username')
            .eq('kick_username', participant.kick_username)
            .maybeSingle();
        }

        console.log(`🔧 Debug: Profile query result for ${participant.kick_username}:`, profileData);

        let isVerified = false;
        if (profileData.data?.user_id) {
          const { data: roleData } = await supabase
            .rpc('get_user_role', { _user_id: profileData.data.user_id });
          isVerified = roleData === 'verified_viewer';
          console.log(`🔍 ${participant.kick_username} role check: ${roleData} (user_id: ${profileData.data.user_id})`);
        } else {
          console.log(`🔍 No profile found for ${participant.kick_username}`);
        }
        
        console.log(`🔍 ${participant.kick_username}: verified=${isVerified}`);
        
        // Update the participant's verification status
        const { error: updateError } = await supabase
          .from('giveaway_participants')
          .update({ is_verified: isVerified })
          .eq('id', participant.id);

        if (updateError) {
          console.error(`❌ Error updating verification for ${participant.kick_username}:`, updateError);
        } else {
          console.log(`✅ Updated verification status for ${participant.kick_username}: ${isVerified}`);
        }
      }

      // Refresh the giveaways data
      await fetchGiveaways();
      
      toast({
        title: "✅ Verification Status Updated",
        description: "All participant verification statuses have been refreshed",
      });
      
    } catch (error) {
      console.error('❌ Error refreshing verification status:', error);
      toast({
        title: "Error",
        description: "Failed to refresh verification status",
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

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-12 bg-gradient-primary/10 rounded-xl border border-primary/20">
            <div className="max-w-2xl mx-auto px-6">
              <Gift className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-4">Giveaway Manager</h1>
              <p className="text-xl text-muted-foreground mb-6">
                Login to manage your Kick.com giveaways with real-time chat integration.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'} 
                className="gaming-button"
                size="lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Login to Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This section is no longer needed since Kick users auto-get Supabase accounts
  // Keeping this comment for reference, but the security barrier is removed

  return (
    <KickAccountGuard 
      feature="Giveaway Manager" 
      description="Create and manage giveaways with real-time chat integration. Monitor your Kick channel for keywords and automatically add participants."
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
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
              <DialogContent className="gaming-card border-border/50 max-w-lg">{/* Increased width for verification options */}
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Giveaway</DialogTitle>
                </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-kick-green/10 rounded-lg border border-kick-green/30">
                  <p className="text-sm text-kick-green font-medium">
                    🎯 This giveaway will run on your channel: @{getChannelInfo()?.channelName}
                  </p>
                </div>
                
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
                    <Label htmlFor="channel">Channel Name</Label>
                    <Input
                      id="channel"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="Your channel name"
                      className="bg-secondary/30"
                      disabled // User can only create giveaways for their own channel
                    />
                    <p className="text-xs text-muted-foreground">
                      You can only create giveaways for your own channel
                    </p>
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
                  
                  {/* Verification Options */}
                  <div className="space-y-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <Label className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      Verification Settings
                    </Label>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="verified-only"
                        checked={verifiedOnly}
                        onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
                      />
                      <Label htmlFor="verified-only" className="text-sm">
                        Verified viewers only
                      </Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bonus-chances" className="text-sm">
                        Extra chances for verified viewers
                      </Label>
                      <Input
                        id="bonus-chances"
                        type="number"
                        min="0"
                        max="10"
                        value={verifiedBonusChances}
                        onChange={(e) => setVerifiedBonusChances(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-secondary/30"
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of extra chances verified viewers get (0-10)
                      </p>
                    </div>
                  </div>
                  
                  {/* Auto-start monitoring checkbox */}
                  <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg border border-accent/20">
                    <Checkbox 
                      id="auto-start"
                      checked={autoStartMonitoring}
                      onCheckedChange={(checked) => setAutoStartMonitoring(checked === true)}
                    />
                    <Label htmlFor="auto-start" className="text-sm font-medium">
                      Auto start keyword tracking
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, chat monitoring will start automatically after creating the giveaway
                  </p>
                  
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
        <RouletteModal
          isOpen={isRouletteModalOpen}
          onClose={() => setIsRouletteModalOpen(false)}
          giveaway={currentGiveaway}
          participants={participants}
          pendingWinners={pendingWinners}
          onEndGiveaway={async (winners) => {
            await handleAcceptAllWinners();
            setIsRouletteModalOpen(false);
            // Clear saved state after ending giveaway is handled in handleAcceptAllWinners
          }}
          onSavePendingWinners={handleSavePendingWinners}
        />

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
                        onClick={() => refreshVerificationStatus(giveaway.id)}
                        className="flex items-center gap-2 text-blue-400"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Refresh Verification
                      </DropdownMenuItem>
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
                      {chatConnected && connectedChannel === extractChannel(giveaway.description) ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex-1"
                            onClick={stopChatMonitoring}
                          >
                            <MonitorX className="h-3 w-3 mr-2" />
                            Stop Monitor
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                            onClick={() => setIsLiveChatModalOpen(true)}
                          >
                            <MessageSquare className="h-3 w-3 mr-2" />
                            View Chat
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          onClick={() => joinChatChannel(extractChannel(giveaway.description))}
                        >
                          <Monitor className="h-3 w-3 mr-2" />
                          Start Monitor
                        </Button>
                      )}
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

        {/* Live Chat Activity Modal */}
        <Dialog open={isLiveChatModalOpen} onOpenChange={setIsLiveChatModalOpen}>
          <DialogContent className="gaming-card border-border/50 max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Monitor className="h-5 w-5 text-green-400" />
                Live Chat Activity - {connectedChannel}
                {chatConnected && (
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    Monitoring
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Participants joining in real-time
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-primary">
                    {liveParticipants.length} Entries
                  </Badge>
                  {chatConnected && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopChatMonitoring}
                    >
                      <MonitorX className="h-4 w-4 mr-2" />
                      Stop Monitoring
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="bg-secondary/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                {liveParticipants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Waiting for participants...</p>
                    <p className="text-xs mt-1">Users will appear here when they enter the giveaway</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveParticipants.map((participant, index) => (
                      <div 
                        key={`${participant.username}-${participant.timestamp.getTime()}`}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 animate-fade-in hover:bg-background/70 cursor-pointer transition-colors"
                        onClick={() => viewUserProfile(participant.username)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-r from-kick-green to-kick-purple rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {participant.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {participant.isVerified && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {participant.username}
                              </span>
                              {participant.isVerified && (
                                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Used keyword: <span className="text-accent font-mono">{participant.keyword}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {participant.timestamp.toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-green-400">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {liveParticipants.length > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  Showing last {Math.min(liveParticipants.length, 50)} participants
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* User Profile Modal */}
        <Dialog open={!!selectedUserProfile} onOpenChange={(open) => !open && setSelectedUserProfile(null)}>
          <DialogContent className="gaming-card border-border/50 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />
                User Profile - {selectedUserProfile?.username}
              </DialogTitle>
            </DialogHeader>
            {selectedUserProfile && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                      {selectedUserProfile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{selectedUserProfile.username}</h3>
                      {selectedUserProfile.isVerified ? (
                        <Badge variant="secondary" className="text-green-400 border-green-400/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      Total giveaway entries: {selectedUserProfile.totalGiveawayEntries}
                    </p>
                  </div>
                </div>

                {/* Recent Giveaway Participation */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Recent Giveaway Participation
                  </h4>
                  {selectedUserProfile.recentParticipations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No recent giveaway participation</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedUserProfile.recentParticipations.map((participation, index) => (
                        <div 
                          key={`${participation.giveawayId}-${index}`}
                          className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{participation.giveawayTitle}</div>
                            <div className="text-sm text-muted-foreground">
                              Channel: {participation.channelName}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {participation.joinedAt.toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </KickAccountGuard>
  );
}