import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKickAccount } from "@/hooks/useKickAccount";
import { useAutoMonitor } from "@/hooks/useAutoMonitor";
import { Dices, Trophy, Play, Square, Clock, Users, Target, ExternalLink, Copy, Settings, Palette, Trash2 } from "lucide-react";
import { TestCallDialog } from "@/components/TestCallDialog";

interface SlotsEvent {
  id: string;
  title: string;
  max_calls_per_user: number;
  bet_size: number;
  prize: string;
  status: string;
  channel_id?: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
  user_id: string;
  calls_count?: number;
}

interface SlotsCall {
  id: string;
  event_id: string;
  viewer_username: string;
  viewer_kick_id?: string;
  slot_name: string;
  bet_amount: number;
  win_amount?: number;
  multiplier?: number;
  status: string;
  submitted_at: string;
  completed_at?: string;
  call_order: number;
}

export default function SlotsCalls() {
  const { user } = useAuth();
  const { canUseChatbot, isKickLinked, kickUser } = useKickAccount();
  const { startAutoMonitoring, monitorStatus, checkMonitoringStatus } = useAutoMonitor();
  
  // Use auto-monitor for command processing + WebSocket for real-time chat display
  const socketRef = useRef<WebSocket | null>(null);
  const [isManualMonitoring, setIsManualMonitoring] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState("");
  const { toast } = useToast();
  
  const [events, setEvents] = useState<SlotsEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SlotsEvent | null>(null);
  const [calls, setCalls] = useState<SlotsCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [maxCallsPerUser, setMaxCallsPerUser] = useState(1);
  const [betSize, setBetSize] = useState("");
  const [prize, setPrize] = useState("");
  const [autoStartMonitoring, setAutoStartMonitoring] = useState(false);
  const [autoStopEnabled, setAutoStopEnabled] = useState(false);
  const [autoStopMinutes, setAutoStopMinutes] = useState(30);
  
  // Persistent monitoring state
  const [monitoringTimer, setMonitoringTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Random selection states
  const [randomSelectionCount, setRandomSelectionCount] = useState(10);
  const [isRandomSelectionDialogOpen, setIsRandomSelectionDialogOpen] = useState(false);
  const [isAnimationModalOpen, setIsAnimationModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [eliminatedNames, setEliminatedNames] = useState<Set<string>>(new Set());
  const [finalWinners, setFinalWinners] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Sound effect functions
  const playWinSound = () => {
    if (isSoundMuted) return;
    try {
      // Create a satisfying win sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create ascending notes for celebration
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      let noteIndex = 0;
      
      const playNote = () => {
        if (noteIndex < notes.length) {
          if (!isSoundMuted) {
            oscillator.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          }
          noteIndex++;
          if (noteIndex < notes.length) {
            setTimeout(playNote, 150);
          } else {
            oscillator.stop();
          }
        }
      };
      
      oscillator.type = 'triangle';
      oscillator.start();
      playNote();
    } catch (error) {
      console.log('Audio context not available');
    }
  };

  const playEliminationSound = () => {
    if (isSoundMuted) return;
    try {
      // Create a descending elimination sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio context not available');
    }
  };

  const playWinnerHighlightSound = () => {
    if (isSoundMuted) return;
    try {
      // Create a quick positive notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1); // A5 note
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.log('Audio context not available');
    }
  };

  // Auto-scroll to follow animation progress
  const scrollToCurrentElimination = (eliminatedCount: number, totalToEliminate: number) => {
    if (!gridRef?.current) return;
    
    // Calculate scroll position based on elimination progress
    const container = gridRef.current;
    const progress = eliminatedCount / totalToEliminate;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const targetScroll = progress * maxScroll;
    
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };
  // Overlay customization states
  const [overlaySettings, setOverlaySettings] = useState({
    background_color: 'rgba(0, 0, 0, 0.95)',
    border_color: '#3b82f6',
    text_color: '#ffffff',
    accent_color: '#3b82f6',
    font_size: 'medium',
    max_visible_calls: 10,
    scrolling_speed: 50,
    show_background: true,
    show_borders: true,
    animation_enabled: true
  });
  // Prevent body scroll during animation modal
  useEffect(() => {
    if (isAnimationModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isAnimationModalOpen]);
  
  // Color presets for overlay themes
  const colorPresets = [
    {
      name: "Gaming Blue",
      background: "rgba(15, 23, 42, 0.95)",
      border: "#3b82f6",
      text: "#ffffff",
      accent: "#60a5fa"
    },
    {
      name: "Neon Purple",
      background: "rgba(30, 9, 51, 0.95)",
      border: "#a855f7",
      text: "#ffffff",
      accent: "#c084fc"
    },
    {
      name: "Fire Red",
      background: "rgba(51, 12, 12, 0.95)",
      border: "#ef4444",
      text: "#ffffff",
      accent: "#f87171"
    },
    {
      name: "Matrix Green",
      background: "rgba(5, 20, 5, 0.95)",
      border: "#22c55e",
      text: "#ffffff",
      accent: "#4ade80"
    },
    {
      name: "Gold Luxury",
      background: "rgba(20, 16, 8, 0.95)",
      border: "#facc15",
      text: "#ffffff",
      accent: "#fde047"
    },
    {
      name: "Clean White",
      background: "rgba(248, 250, 252, 0.95)",
      border: "#64748b",
      text: "#1e293b",
      accent: "#3b82f6"
    }
  ];
  
  // Result input states
  const [winAmount, setWinAmount] = useState("");
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchOverlaySettings();
      restoreMonitoringState(); // Restore persistent monitoring
    }
  }, [user]);

  // Fetch calls when selected event changes
  useEffect(() => {
    if (selectedEvent) {
      fetchCalls(selectedEvent.id);
    }
  }, [selectedEvent]);

  // Set up real-time subscription for events list
  useEffect(() => {
    if (!user?.id) return;

    const eventsChannel = supabase
      .channel(`events_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slots_events',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('🎰 Events list changed, refreshing...');
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [user?.id]);

  // Check if auto-monitoring is already active
  const restoreMonitoringState = () => {
    // Auto-monitor handles persistence automatically
    console.log('🎰 Auto-monitor handles monitoring persistence');
  };

  // Auto-monitor handles state persistence automatically
  const saveMonitoringState = (isActive: boolean, channelName?: string) => {
    // No longer needed with auto-monitor
  };


  // Start monitoring using both auto-monitor (for processing) and WebSocket (for display)
  const initializeMonitoring = async () => {
    if (!canUseChatbot) {
      toast({
        title: "🔄 Restarting Monitor...",
        description: "Initializing chat monitor, please wait...",
      });
      
      toast({
        title: "Error",
        description: "Please link your Kick account to use chat monitoring",
        variant: "destructive",
      });
      return;
    }

    // Show immediate feedback
    toast({
      title: "🔄 Restarting Monitor...",
      description: "Initializing chat monitor, please wait...",
    });

    try {
      await startAutoMonitoring();
      
      // Check status multiple times to ensure UI updates
      setTimeout(() => checkMonitoringStatus(), 1000);
      setTimeout(() => checkMonitoringStatus(), 3000);
      setTimeout(() => checkMonitoringStatus(), 5000);
      
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }

    try {
      console.log('🎰 [SLOTS] Starting comprehensive monitoring');
      setIsManualMonitoring(true);
      
      // Always restart auto-monitoring to ensure it's properly connected
      console.log('🤖 Restarting auto-monitor for fresh connection');
      await startAutoMonitoring();
      
      // Refresh monitor status after starting
      setTimeout(() => {
        checkMonitoringStatus();
      }, 2000);
      
      // Start WebSocket for real-time chat display (no command processing)
      initializeChatDisplay();
      
      // Setup auto-stop timer if enabled
      if (autoStopEnabled && autoStopMinutes > 0) {
        setupAutoStopTimer();
      }
      
      toast({
        title: "🎰 Monitor Restarting",
        description: "Auto-monitor is being restarted - please wait a moment for status update",
      });
      
    } catch (error) {
      console.error("🎰 [SLOTS] Error starting monitoring:", error);
      setIsManualMonitoring(false);
      toast({
        title: "Slots Monitoring Error",
        description: "Failed to start slots monitoring",
        variant: "destructive",
      });
    }
  };

  // Initialize WebSocket for real-time chat display only (no command processing)
  const initializeChatDisplay = () => {
    if (!kickUser) return;

    try {
      const wsUrl = `wss://xdjtgkgwtsdpfftrrouz.functions.supabase.co/kick-chat-monitor`;
      console.log('🎰 [DISPLAY] Connecting to chat display WebSocket:', wsUrl);
      
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("🎰 [DISPLAY] Connected to chat display");
        
        // Join the channel for display only (with special flag to prevent command processing)
        if (kickUser) {
          const joinMessage = {
            type: 'join_channel',
            channelName: typeof kickUser === 'string' ? kickUser : kickUser.username || kickUser.toString(),
            source: 'slots_display_only' // Special flag to indicate display-only mode
          };
          console.log("🎰 [DISPLAY] Sending join message:", joinMessage);
          socketRef.current?.send(JSON.stringify(joinMessage));
        }
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('🎰 [DISPLAY] Received from chat monitor:', data);

        switch (data.type) {
          case 'connected':
            setChatConnected(true);
            setConnectedChannel(data.channelName);
            console.log(`🎰 [DISPLAY] Connected to chat display for: ${data.channelName}`);
            break;
            
          case 'chat_message':
            console.log('🎰 [DISPLAY] Chat message received:', data.data);
            // Just display the message, don't process commands (auto-monitor handles that)
            break;
            
          case 'disconnected':
            setChatConnected(false);
            setConnectedChannel("");
            break;
            
          case 'error':
            console.error('🎰 [DISPLAY] WebSocket error:', data.message);
            break;
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("🎰 [DISPLAY] WebSocket error:", error);
      };

      socketRef.current.onclose = () => {
        console.log("🎰 [DISPLAY] WebSocket disconnected");
        setChatConnected(false);
        setConnectedChannel("");
      };

    } catch (error) {
      console.error("🎰 [DISPLAY] Error connecting to WebSocket:", error);
    }
  };

  // Cleanup WebSocket and timer on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearAutoStopTimer();
    };
  }, []);

  // Auto-stop timer functions
  const setupAutoStopTimer = () => {
    clearAutoStopTimer(); // Clear any existing timer
    const timer = setTimeout(() => {
      stopMonitoring(true); // true indicates auto-stop
    }, autoStopMinutes * 60 * 1000);
    setMonitoringTimer(timer);
    console.log(`🎰 Auto-stop timer set for ${autoStopMinutes} minutes`);
  };

  const clearAutoStopTimer = () => {
    if (monitoringTimer) {
      clearTimeout(monitoringTimer);
      setMonitoringTimer(null);
    }
  };

  const stopMonitoring = async (isAutoStop = false) => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setChatConnected(false);
    setConnectedChannel("");
    setIsManualMonitoring(false);
    clearAutoStopTimer();
    
    // Stop the auto-monitor 
    try {
      const response = await supabase.functions.invoke('kick-auto-monitor', {
        body: {
          action: 'stop_monitoring',
          user_id: user?.id
        }
      });
      
      if (!response.error && response.data?.success) {
        console.log('✅ Auto-monitor stopped successfully');
      }
    } catch (error) {
      console.error('❌ Error stopping auto-monitor:', error);
    }
    
    toast({
      title: isAutoStop ? "🕐 Auto-Stop Triggered" : "🛑 Auto-Monitor Stopped",
      description: isAutoStop ? "Auto-monitoring stopped after timer" : "Auto-monitoring manually stopped",
    });
  };

  // Set up real-time subscription to detect new slots calls
  useEffect(() => {
    if (!selectedEvent) return;

    console.log('🔗 CREATING realtime subscription for event:', selectedEvent.id, 'at', Date.now());
    
    const channel = supabase
      .channel(`slots_calls_${selectedEvent.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'slots_calls',
          filter: `event_id=eq.${selectedEvent.id}`
        },
        (payload) => {
          console.log('🎰 Real-time INSERT detected:', payload.new?.viewer_username, 'ID:', payload.new?.id);
          const newCall = payload.new as SlotsCall;
          
          toast({
            title: "🎰 New Slots Call!",
            description: `${newCall.viewer_username} called ${newCall.slot_name}`,
          });
          
          // Add the new call to state immediately for instant UI update
          setCalls(prevCalls => [...prevCalls, newCall].sort((a, b) => 
            new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'slots_calls',
          filter: `event_id=eq.${selectedEvent.id}`
        },
        (payload) => {
          console.log('🎰 Slots call updated:', payload.new);
          const updatedCall = payload.new as SlotsCall;
          
          // Update the call in state immediately
          setCalls(prevCalls => 
            prevCalls.map(call => 
              call.id === updatedCall.id ? updatedCall : call
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'slots_calls',
          filter: `event_id=eq.${selectedEvent.id}`
        },
        (payload) => {
          console.log('🎰 Slots call deleted:', payload.old);
          const deletedCall = payload.old as SlotsCall;
          
          // Remove the call from state immediately
          setCalls(prevCalls => 
            prevCalls.filter(call => call.id !== deletedCall.id)
          );
        }
      )
      .subscribe();

    return () => {
      console.log('🔗 CLEANING UP realtime subscription for event:', selectedEvent.id, 'at', Date.now());
      supabase.removeChannel(channel);
    };
  }, [selectedEvent?.id]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('slots_events')
        .select(`
          *,
          slots_calls(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventsWithCounts = data?.map(event => ({
        ...event,
        calls_count: event.slots_calls?.[0]?.count || 0
      })) || [];

      setEvents(eventsWithCounts);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalls = async (eventId: string) => {
    try {
      console.log('🎰 Fetching calls for event:', eventId);
      const { data, error } = await supabase
        .from('slots_calls')
        .select('*')
        .eq('event_id', eventId)
        .order('call_order', { ascending: true });

      if (error) throw error;
      
      console.log('🎰 Fetched calls:', data?.length || 0);
      setCalls(data || []);
    } catch (error) {
      console.error("Error fetching calls:", error);
      toast({
        title: "Error",
        description: "Failed to fetch slot calls",
        variant: "destructive",
      });
    }
  };

  const fetchOverlaySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('overlay_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error("Error fetching overlay settings:", error);
        return;
      }

      if (data) {
        setOverlaySettings(data);
      }
    } catch (error) {
      console.error("Error fetching overlay settings:", error);
    }
  };

  const saveOverlaySettings = async () => {
    try {
      const { error } = await supabase
        .from('overlay_settings')
        .upsert({
          user_id: user?.id,
          ...overlaySettings
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Overlay settings saved successfully!",
      });

      setIsOverlayDialogOpen(false);
    } catch (error) {
      console.error("Error saving overlay settings:", error);
      toast({
        title: "Error",
        description: "Failed to save overlay settings",
        variant: "destructive",
      });
    }
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setOverlaySettings(prev => ({
      ...prev,
      background_color: preset.background,
      border_color: preset.border,
      text_color: preset.text,
      accent_color: preset.accent
    }));
  };

  const createEvent = async () => {
    if (!title.trim() || !betSize || !prize.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if there's already an active event
      const { data: activeEvents, error: checkError } = await supabase
        .from('slots_events')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (checkError) throw checkError;

      if (activeEvents && activeEvents.length > 0) {
        toast({
          title: "Error",
          description: "You can only have one active event at a time. Please close your current event first.",
          variant: "destructive",
        });
        return;
      }
      // Get the linked Kick username from profile to use as channel_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('kick_username, linked_kick_username')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Error",
          description: "Failed to get your Kick profile information",
          variant: "destructive"
        });
        return;
      }

      // Use linked kick username if available, otherwise fall back to kick_username
      const channelUsername = profile?.linked_kick_username || profile?.kick_username;
      
      if (!channelUsername) {
        toast({
          title: "No Kick Account",
          description: "Please link your Kick account first",
          variant: "destructive"
        });
        return;
      }

      console.log(`🎰 Creating slots event for channel: ${channelUsername}`);

      const { error } = await supabase
        .from('slots_events')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          max_calls_per_user: maxCallsPerUser,
          bet_size: parseFloat(betSize),
          prize: prize.trim(),
          status: 'active',
          channel_id: channelUsername
        });

      if (error) throw error;

      // Auto-start monitoring if enabled
      if (autoStartMonitoring) {
        console.log('🤖 Auto-starting monitoring for slots event...');
        setTimeout(() => {
          initializeMonitoring();
        }, 1000);
      }

      const successMessage = `🎰 Event "${title}" created for @${channelUsername} and monitoring started!`;

      toast({
        title: "Success",
        description: successMessage,
      });

      setTitle("");
      setMaxCallsPerUser(1);
      setBetSize("");
      setPrize("");
      setAutoStartMonitoring(false);
      setIsCreateDialogOpen(false);
      
      await fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const updateEventStatus = async (eventId: string, status: 'active' | 'closed' | 'completed') => {
    try {
      const { error } = await supabase
        .from('slots_events')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', eventId);

      if (error) throw error;

      const statusMessage = status === 'closed' ? 'Entry closed - Event now visible in overlay!' : 
                           status === 'completed' ? 'Event completed' : 
                           `Event ${status}`;

      toast({
        title: "Success",
        description: statusMessage,
      });

      fetchEvents();
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const addResult = async (callId: string) => {
    if (!winAmount || isNaN(parseFloat(winAmount))) {
      toast({
        title: "Error",
        description: "Please enter a valid win amount",
        variant: "destructive",
      });
      return;
    }

    const call = calls.find(c => c.id === callId);
    if (!call) return;

    const winAmountValue = parseFloat(winAmount);
    const multiplier = winAmountValue / call.bet_amount;

    try {
      const { error } = await supabase
        .from('slots_calls')
        .update({
          win_amount: winAmountValue,
          multiplier: multiplier,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', callId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Result added: ${multiplier.toFixed(2)}x multiplier`,
      });

      setWinAmount("");
      setSelectedCallId(null);
      if (selectedEvent) {
        fetchCalls(selectedEvent.id);
      }
    } catch (error) {
      console.error("Error adding result:", error);
    }
  };

  const performRandomSelection = async () => {
    if (!selectedEvent || !randomSelectionCount) {
      toast({
        title: "Error",
        description: "Please specify the number of calls to randomly select",
        variant: "destructive",
      });
      return;
    }

    const pendingCalls = calls.filter(call => call.status === 'pending');
    
    if (pendingCalls.length === 0) {
      toast({
        title: "No Pending Calls",
        description: "There are no pending calls to select from",
        variant: "destructive",
      });
      return;
    }

    if (pendingCalls.length <= randomSelectionCount) {
      toast({
        title: "Selection Not Needed", 
        description: `You have ${pendingCalls.length} pending calls. Selection is only needed when you have more participants than winners.`,
        variant: "destructive"
      });
      return;
    }

    // STEP 1: PREDETERMINE WINNERS IMMEDIATELY (never changes after this)
    const allNames = pendingCalls.map(call => call.viewer_username);
    
    // Use crypto.getRandomValues for better randomness
    const randomBytes = new Uint32Array(pendingCalls.length);
    crypto.getRandomValues(randomBytes);
    
    // Sort using predetermined random values (immutable)
    const shuffled = [...pendingCalls].map((call, index) => ({
      ...call,
      randomValue: randomBytes[index]
    })).sort((a, b) => a.randomValue - b.randomValue);
    
    const selectedCalls = shuffled.slice(0, randomSelectionCount);
    const callsToShow = shuffled.slice(randomSelectionCount); // These will show as eliminated in animation
    const winnersNames = selectedCalls.map(call => call.viewer_username);

    console.log("🎲 PREDETERMINED WINNERS (FINAL):", {
      totalCalls: pendingCalls.length,
      selectedCount: randomSelectionCount,
      winners: winnersNames,
      eliminatedInAnimation: callsToShow.map(c => c.viewer_username),
      timestamp: Date.now()
    });

    // STEP 2: Lock the results in state (cannot be changed by user actions)
    setAnimationNames([...allNames]); // Freeze snapshot
    setEliminatedNames(new Set());
    setFinalWinners([...winnersNames]); // Freeze snapshot
    setIsRandomSelectionDialogOpen(false);
    setIsAnimationModalOpen(true);

    // STEP 3: Start animation with predetermined results (visual only)
    await startEliminationAnimation(allNames, winnersNames, selectedCalls, callsToShow);
  };

  const startEliminationAnimation = async (allNames: string[], winners: string[], selectedCalls: any[], callsToShowAsEliminated: any[]) => {
    console.log("🎬 STARTING VISUAL ANIMATION with locked results:", {
      winners,
      visuallyEliminatedCount: callsToShowAsEliminated.length,
      note: "This is visual only - no database records will be deleted"
    });

    const losers = allNames.filter(name => !winners.includes(name));
    
    // ANIMATION PHASE: Visual only, results already locked
    // User interactions during this phase cannot affect the outcome
    let animationCompleted = false;
    let animationSkipped = false;

    // Set up skip mechanism
    const skipAnimation = () => {
      if (!animationCompleted && !animationSkipped) {
        animationSkipped = true;
        setEliminatedNames(new Set(losers)); // Show final state immediately
        console.log("⏭️ Animation skipped");
        
        // Play winner highlight sound immediately when skipped
        playWinnerHighlightSound();
        
        // Close modal after short delay to show final results
        setTimeout(() => {
          setIsAnimationModalOpen(false);
          playWinSound(); // Play win sound even when skipped
          // Apply database changes after animation ends
          applyDatabaseChanges(selectedCalls, callsToShowAsEliminated);
        }, 1500);
      }
    };

    // Add global skip listener (ESC key)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipAnimation();
      }
    };

    // Store skip function in a ref so the button can access it
    (window as any).skipRouletteAnimation = skipAnimation;
    
    document.addEventListener('keydown', handleEscape);
    
    try {
      // Animate elimination one by one (unless skipped)
      for (let i = 0; i < losers.length && !animationSkipped; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!animationSkipped) {
          setEliminatedNames(prev => {
            const newSet = new Set([...prev, losers[i]]);
            // Auto-scroll and play elimination sound
            setTimeout(() => {
              scrollToCurrentElimination(newSet.size, losers.length);
              playEliminationSound();
            }, 100);
            return newSet;
          });
        }
      }

      // Wait to show final winners (skippable)
      if (!animationSkipped) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Highlight winners with sound effects
        playWinnerHighlightSound();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Play final win sound
        playWinSound();
        
        // Animation completed naturally, close modal and apply changes
        setIsAnimationModalOpen(false);
        await applyDatabaseChanges(selectedCalls, callsToShowAsEliminated);
      }

      animationCompleted = true;
    } finally {
      // Cleanup listeners and global function
      document.removeEventListener('keydown', handleEscape);
      delete (window as any).skipRouletteAnimation;
    }

  };

  // EXECUTION PHASE: Apply the predetermined results
  const applyDatabaseChanges = async (selectedCalls: any[], callsToShowAsEliminated: any[]) => {
    console.log("📝 APPLYING DATABASE CHANGES:", {
      selectedCount: selectedCalls.length,
      eliminatedCount: callsToShowAsEliminated.length,
      winners: selectedCalls.map(c => c.viewer_username)
    });

    try {
      // Delete eliminated calls from database (winners stay as pending)
      const callIdsToDelete = callsToShowAsEliminated.map(c => c.id);
      if (callIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('slots_calls')
          .delete()
          .in('id', callIdsToDelete);
          
        if (deleteError) {
          console.error("❌ Error deleting eliminated calls:", deleteError);
        }
      }

      // Refresh the calls list
      if (selectedEvent) {
        await fetchCalls(selectedEvent.id);
      }

      toast({
        title: "🎉 Random Selection Complete",
        description: `${selectedCalls.length} winners selected and ${callsToShowAsEliminated.length} calls removed. Winners remain as pending calls.`,
      });

    } catch (error) {
      console.error("❌ Database operation failed:", error);
      toast({
        title: "Error",
        description: "Failed to apply random selection changes",
        variant: "destructive",
      });
    }
  };

  const deleteCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('slots_calls')
        .delete()
        .eq('id', callId);

      if (error) throw error;

      toast({
        title: "Call Deleted",
        description: "The slot call has been removed from the queue",
      });

      if (selectedEvent) {
        fetchCalls(selectedEvent.id);
      }
    } catch (error) {
      console.error("Error deleting call:", error);
      toast({
        title: "Error",
        description: "Failed to delete the call",
        variant: "destructive",
      });
    }
  };

  const getWinner = () => {
    const completedCalls = calls.filter(call => call.status === 'completed' && call.multiplier);
    if (completedCalls.length === 0) return null;

    return completedCalls.reduce((winner, call) => {
      if (!winner || (call.multiplier || 0) > (winner.multiplier || 0)) {
        return call;
      }
      if (call.multiplier === winner.multiplier && call.call_order < winner.call_order) {
        return call;
      }
      return winner;
    }, completedCalls[0]);
  };

  const getOverlayUrl = (userId?: string) => {
    const baseUrl = window.location.origin;
    // Use the provided userId, or the logged-in user's ID, or the selected event's user_id
    const userIdParam = userId || user?.id;
    console.log('🔗 Creating overlay URL for userId:', userIdParam);
    // Add cache-busting parameter to ensure OBS gets latest settings
    const cacheBuster = Date.now();
    return `${baseUrl}/overlay/slots?userId=${userIdParam}&maxCalls=10&cb=${cacheBuster}`;
  };

  const copyOverlayUrl = () => {
    const url = getOverlayUrl();
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Copied!",
        description: "Overlay URL copied to clipboard. If OBS isn't showing latest settings, refresh the browser source.",
        duration: 5000,
      });
    });
  };

  const openOverlayPreview = () => {
    const url = getOverlayUrl();
    console.log('🚀 Opening overlay preview with URL:', url);
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'closed': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading slots events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dices className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Slots Calls</h1>
            <p className="text-muted-foreground">Manage viewer slot call events</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={copyOverlayUrl}
            variant="outline"
            className="gaming-button"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Overlay URL
          </Button>
          
          <Button
            onClick={openOverlayPreview}
            variant="outline"
            className="gaming-button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Overlay
          </Button>
          
          
          <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gaming-button">
                <Settings className="h-4 w-4 mr-2" />
                Customize Overlay
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Overlay Customization
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">{/* Scrollable content area */}
                {/* Color Presets */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">🎨 Color Themes</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {colorPresets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyColorPreset(preset)}
                        className="group relative p-3 rounded-lg border-2 border-border hover:border-primary transition-all duration-200 hover:scale-105 min-h-[60px]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1 flex-shrink-0">
                            <div 
                              className="w-4 h-4 rounded-full border flex-shrink-0"
                              style={{ backgroundColor: preset.background.replace('0.95', '1') }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border flex-shrink-0"
                              style={{ backgroundColor: preset.border }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border flex-shrink-0"
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                          <span className="text-sm font-medium truncate">{preset.name}</span>
                        </div>
                        <div 
                          className="absolute inset-0 rounded-lg opacity-10 group-hover:opacity-20 transition-opacity"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">🎯 Custom Colors</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2 flex-wrap">
                        <span>Background Color</span>
                        <div 
                          className="w-4 h-4 rounded border flex-shrink-0"
                          style={{ backgroundColor: overlaySettings.background_color.includes('rgba') ? '#000000' : overlaySettings.background_color }}
                        />
                      </Label>
                      <Input
                        type="color"
                        value={overlaySettings.background_color.includes('rgba') ? '#000000' : overlaySettings.background_color}
                        onChange={(e) => setOverlaySettings({...overlaySettings, background_color: e.target.value})}
                        className="h-12 cursor-pointer w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2 flex-wrap">
                        <span>Border Color</span>
                        <div 
                          className="w-4 h-4 rounded border flex-shrink-0"
                          style={{ backgroundColor: overlaySettings.border_color }}
                        />
                      </Label>
                      <Input
                        type="color"
                        value={overlaySettings.border_color}
                        onChange={(e) => setOverlaySettings({...overlaySettings, border_color: e.target.value})}
                        className="h-12 cursor-pointer w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2 flex-wrap">
                        <span>Text Color</span>
                        <div 
                          className="w-4 h-4 rounded border flex-shrink-0"
                          style={{ backgroundColor: overlaySettings.text_color }}
                        />
                      </Label>
                      <Input
                        type="color"
                        value={overlaySettings.text_color}
                        onChange={(e) => setOverlaySettings({...overlaySettings, text_color: e.target.value})}
                        className="h-12 cursor-pointer w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2 flex-wrap">
                        <span>Accent Color</span>
                        <div 
                          className="w-4 h-4 rounded border flex-shrink-0"
                          style={{ backgroundColor: overlaySettings.accent_color }}
                        />
                      </Label>
                      <Input
                        type="color"
                        value={overlaySettings.accent_color}
                        onChange={(e) => setOverlaySettings({...overlaySettings, accent_color: e.target.value})}
                        className="h-12 cursor-pointer w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">👀 Preview</Label>
                  <div 
                    className="p-4 rounded-lg border-2 min-h-[100px] flex items-center justify-center text-center transition-all duration-300 w-full"
                    style={{
                      backgroundColor: overlaySettings.show_background ? overlaySettings.background_color : 'transparent',
                      borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent',
                      color: overlaySettings.text_color
                    }}
                  >
                    <div className="space-y-2 w-full">
                      <div 
                        className="font-semibold"
                        style={{ 
                          fontSize: overlaySettings.font_size === 'small' ? '14px' : overlaySettings.font_size === 'large' ? '18px' : '16px',
                          color: overlaySettings.accent_color 
                        }}
                      >
                        🎰 Slot Calls Queue
                      </div>
                      <div style={{ color: overlaySettings.text_color, fontSize: '14px' }} className="break-words">
                        ViewerName: Sweet Bonanza ($10.00)
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">⚙️ Display Settings</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Select value={overlaySettings.font_size} onValueChange={(value) => setOverlaySettings({...overlaySettings, font_size: value})}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Max Visible Calls</Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={overlaySettings.max_visible_calls}
                        onChange={(e) => setOverlaySettings({...overlaySettings, max_visible_calls: parseInt(e.target.value) || 10})}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Scrolling Speed (ms)</Label>
                      <Input
                        type="number"
                        min="10"
                        max="500"
                        value={overlaySettings.scrolling_speed}
                        onChange={(e) => setOverlaySettings({...overlaySettings, scrolling_speed: parseInt(e.target.value) || 50})}
                        className="w-full"
                        placeholder="50"
                      />
                      <p className="text-xs text-muted-foreground">Lower = faster scroll, Higher = slower scroll</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-background"
                        checked={overlaySettings.show_background}
                        onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_background: checked === true})}
                      />
                      <Label htmlFor="show-background">Show Background</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-borders"
                        checked={overlaySettings.show_borders}
                        onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_borders: checked === true})}
                      />
                      <Label htmlFor="show-borders">Show Borders</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="animation-enabled"
                        checked={overlaySettings.animation_enabled}
                        onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, animation_enabled: checked === true})}
                      />
                      <Label htmlFor="animation-enabled">Enable Animations</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 pt-4 border-t">
                  <Button onClick={saveOverlaySettings} className="w-full gaming-button hover:scale-105 transition-transform">
                    💾 Save Overlay Settings
                  </Button>
                </div>
              </div>{/* End scrollable content */}
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gaming-button">
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Slots Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Sweet Bonanza Session"
                  />
                </div>
                <div>
                  <Label htmlFor="maxCalls">Max Calls Per User</Label>
                  <Input
                    id="maxCalls"
                    type="number"
                    min="1"
                    max="5000"
                    value={maxCallsPerUser}
                    onChange={(e) => setMaxCallsPerUser(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum: 5000 calls per user</p>
                </div>
                <div>
                  <Label htmlFor="betSize">Bet Size ($)</Label>
                  <Input
                    id="betSize"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={betSize}
                    onChange={(e) => setBetSize(e.target.value)}
                    placeholder="5.00"
                  />
                </div>
                  <div>
                    <Label htmlFor="prize">Prize</Label>
                    <Textarea
                      id="prize"
                      value={prize}
                      onChange={(e) => setPrize(e.target.value)}
                      placeholder="Describe the prize for the winner"
                      rows={3}
                    />
                  </div>
                  
                  {/* Auto-start monitoring checkbox */}
                  <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg border border-accent/20">
                    <Checkbox 
                      id="auto-start-monitoring"
                      checked={autoStartMonitoring}
                      onCheckedChange={(checked) => setAutoStartMonitoring(checked === true)}
                    />
                    <div>
                      <Label htmlFor="auto-start-monitoring" className="text-sm font-medium">
                        Auto start chat monitoring
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, chat monitoring will start automatically after creating the event
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg border border-accent/20">
                    <Checkbox 
                      id="auto-stop-monitoring"
                      checked={autoStopEnabled}
                      onCheckedChange={(checked) => setAutoStopEnabled(checked === true)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="auto-stop-monitoring" className="text-sm font-medium">
                        Auto stop after timer
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically stop monitoring after specified time
                      </p>
                    </div>
                  </div>
                  
                  {autoStopEnabled && (
                    <div className="ml-6 space-y-2">
                      <Label className="text-sm">Stop after (minutes):</Label>
                      <Input
                        type="number"
                        min="1"
                        max="480"
                        value={autoStopMinutes}
                        onChange={(e) => setAutoStopMinutes(parseInt(e.target.value) || 30)}
                        className="w-20"
                      />
                    </div>
                  )}
                  
                  <Button onClick={createEvent} className="w-full gaming-button">
                    Create Event
                  </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No events created yet
                </p>
              ) : (
                events.map((event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold truncate">{event.title}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Bet: ${event.bet_size}</div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span>{event.calls_count || 0} calls</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Details and Calls */}
        <div className="lg:col-span-2">
          {selectedEvent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedEvent.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span>Bet: ${selectedEvent.bet_size}</span>
                      <span>Max: {selectedEvent.max_calls_per_user} calls/user</span>
                      <Badge className={getStatusColor(selectedEvent.status)}>
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {selectedEvent.status === 'active' && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            monitorStatus?.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                          }`}></div>
                          <span className="text-muted-foreground">
                            {monitorStatus?.is_active ? 'Monitor Active' : 'Monitor Offline'}
                          </span>
                          {/* Show connection status separately */}
                          {monitorStatus?.is_active && (
                            <span className="text-xs text-muted-foreground">
                              ({monitorStatus?.is_connected ? 'Connected' : 'Connecting...'})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={monitorStatus?.is_active ? () => stopMonitoring() : initializeMonitoring}
                            variant={monitorStatus?.is_active ? "destructive" : "default"}
                            size="sm"
                            className="gaming-button"
                          >
                            {monitorStatus?.is_active ? (
                              <>
                                <Square className="h-3 w-3 mr-1" />
                                Stop Auto-Monitor
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Restart Monitor
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            onClick={() => updateEventStatus(selectedEvent.id, 'closed')}
                            variant="outline"
                            size="sm"
                          >
                            Close Entry
                          </Button>
                        </div>
                        
                        {/* Test Call Section - Positioned below on new line */}
                        <div className="flex">
                          <TestCallDialog 
                            selectedEvent={selectedEvent}
                            onCallAdded={() => fetchCalls(selectedEvent.id)}
                          />
                        </div>
                      </>
                    )}
                    {selectedEvent.status === 'closed' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => updateEventStatus(selectedEvent.id, 'active')}
                          variant="outline"
                          size="sm"
                        >
                          Re-open Entry
                        </Button>
                        
                        {/* Random Selection for Closed Events */}
                        {calls.filter(call => call.status === 'pending').length > 1 && (
                          <Dialog open={isRandomSelectionDialogOpen} onOpenChange={setIsRandomSelectionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gaming-button"
                              >
                                🎲 Random Select
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Random Selection (Optional)</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-4 bg-secondary/20 rounded-lg">
                                  <div className="text-sm text-muted-foreground mb-2">
                                    <strong>Current Queue:</strong> {calls.filter(call => call.status === 'pending').length} pending calls
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    This will randomly select the specified number of calls and <strong className="text-destructive">permanently delete</strong> the rest.
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="randomCount">Number of calls to randomly select:</Label>
                                  <Input
                                    id="randomCount"
                                    type="number"
                                    min="1"
                                    max={calls.filter(call => call.status === 'pending').length - 1}
                                    value={randomSelectionCount}
                                    onChange={(e) => setRandomSelectionCount(parseInt(e.target.value) || 10)}
                                    className="mt-2"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Max: {calls.filter(call => call.status === 'pending').length - 1} (must be less than total pending calls)
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={performRandomSelection}
                                      className="flex-1 gaming-button"
                                      variant="destructive"
                                    >
                                      🎲 Perform Random Selection
                                    </Button>
                                    <Button
                                      onClick={() => setIsRandomSelectionDialogOpen(false)}
                                      variant="outline"
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button 
                          onClick={() => updateEventStatus(selectedEvent.id, 'completed')}
                          variant="outline"
                          size="sm"
                        >
                          Complete Event
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Winner Display */}
                  {selectedEvent.status === 'completed' && (() => {
                    const winner = getWinner();
                    return winner ? (
                      <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            <div>
                              <h3 className="font-semibold text-yellow-500">Winner: {winner.viewer_username}</h3>
                              <p className="text-sm">
                                {winner.slot_name} • {winner.multiplier?.toFixed(2)}x • ${winner.win_amount}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null;
                  })()}

                  {/* Calls Queue */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Calls Queue ({calls.length})
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        Capacity: {selectedEvent.max_calls_per_user * 1000} calls max
                        {calls.filter(call => call.status === 'pending').length > 0 && (
                          <span className="ml-2 text-primary">
                            ({calls.filter(call => call.status === 'pending').length} pending)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {calls.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        No calls yet. {selectedEvent.status === 'active' ? (monitorStatus?.is_active ? 'Auto-monitoring is active. Use !kgs [slot name] in chat to make calls.' : 'Click "Start Auto-Monitor" to begin tracking !kgs commands.') : ''}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {(() => {
                          // Group calls by user and only show up to max_calls_per_user
                          const userCallCounts = new Map<string, number>();
                          const filteredCalls = calls.filter(call => {
                            const currentCount = userCallCounts.get(call.viewer_username) || 0;
                            if (currentCount < selectedEvent.max_calls_per_user) {
                              userCallCounts.set(call.viewer_username, currentCount + 1);
                              return true;
                            }
                            return false;
                          });

                          return filteredCalls.map((call, index) => (
                            <Card key={call.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                        #{index + 1}
                                      </span>
                                      <span className="font-semibold">{call.viewer_username}</span>
                                      <span className="text-muted-foreground">→</span>
                                      <span className="text-primary">{call.slot_name}</span>
                                      {userCallCounts.get(call.viewer_username)! > 1 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {calls.filter(c => c.viewer_username === call.viewer_username).indexOf(call) + 1}/{selectedEvent.max_calls_per_user}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Bet: ${call.bet_amount} • 
                                      {call.status === 'completed' ? (
                                        <span className="text-green-400 ml-1">
                                          Win: ${call.win_amount} ({call.multiplier?.toFixed(2)}x)
                                        </span>
                                      ) : (
                                        <Badge className={getStatusColor(call.status)}>
                                          {call.status}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {call.status === 'pending' && selectedEvent.status !== 'completed' && (
                                    <div className="flex items-center gap-2">
                                      {selectedCallId === call.id ? (
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Win amount"
                                            value={winAmount}
                                            onChange={(e) => setWinAmount(e.target.value)}
                                            className="w-24 h-8"
                                          />
                                          <Button 
                                            size="sm" 
                                            onClick={() => addResult(call.id)}
                                          >
                                            Save
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedCallId(null);
                                              setWinAmount("");
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => setSelectedCallId(call.id)}
                                          >
                                            Add Result
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive"
                                            onClick={() => deleteCall(call.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Dices className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Event</h3>
                <p className="text-muted-foreground">
                  Choose an event from the list to view and manage slot calls
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Random Selection Animation Modal */}
      <Dialog 
        open={isAnimationModalOpen} 
        onOpenChange={() => {
          // Prevent closing during animation - winners are already predetermined
          console.log("🔒 Animation modal close prevented - results are locked");
        }}
      >
        <DialogContent 
          className="max-w-4xl max-h-[80vh] overflow-hidden select-none"
          onPointerDown={(e) => e.preventDefault()} // Prevent text selection
          style={{ userSelect: 'none', touchAction: 'none' }} // Prevent scrolling interference
        >
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-primary">
              🎲 Random Selection in Progress...
            </DialogTitle>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Winners are predetermined • Press ESC or click Skip to skip animation • No participants will be deleted
            </div>
          </DialogHeader>
          
          <div className="p-6" onWheel={(e) => e.preventDefault()}>
            <div className="text-center mb-6">
              <p className="text-lg mb-2">
                Selecting {finalWinners.length} winners from {animationNames.length} participants
              </p>
              <div className="w-full bg-secondary rounded-full h-2 mb-4">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: animationNames.length > 0 && finalWinners.length > 0 && (animationNames.length - finalWinners.length) > 0
                      ? `${Math.min(100, (eliminatedNames.size / (animationNames.length - finalWinners.length)) * 100)}%`
                      : eliminatedNames.size > 0 ? '100%' : '0%'
                  }}
                />
              </div>
              
              {/* Skip Animation and Mute Buttons */}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => {
                    // Call the global skip function that handles everything properly
                    if ((window as any).skipRouletteAnimation) {
                      (window as any).skipRouletteAnimation();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="mb-4"
                  disabled={eliminatedNames.size === animationNames.length - finalWinners.length}
                >
                  ⏭️ Skip Animation
                </Button>
                
                <Button
                  onClick={() => {
                    setIsSoundMuted(!isSoundMuted);
                    // Play a quick test sound when unmuting to confirm it works
                    if (isSoundMuted) {
                      setTimeout(() => playWinnerHighlightSound(), 100);
                    }
                  }}
                  variant={isSoundMuted ? "destructive" : "outline"}
                  size="sm"
                  className="mb-4"
                >
                  {isSoundMuted ? '🔇 Unmute' : '🔊 Mute'}
                </Button>
              </div>
            </div>

            {/* Results Grid - Auto-scrolling with animation */}
            <div 
              ref={gridRef}
              className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 p-4 border rounded-lg bg-secondary/10"
              style={{ 
                overflowY: eliminatedNames.size === animationNames.length - finalWinners.length ? 'auto' : 'hidden'
              }}
              onWheel={(e) => {
                // Only allow scrolling when animation is complete
                if (eliminatedNames.size < animationNames.length - finalWinners.length) {
                  e.preventDefault();
                }
              }}
              onTouchMove={(e) => {
                // Only allow touch scrolling when animation is complete
                if (eliminatedNames.size < animationNames.length - finalWinners.length) {
                  e.preventDefault();
                }
              }}
            >
              {animationNames.map((name, index) => {
                const isEliminated = eliminatedNames.has(name);
                const isWinner = finalWinners.includes(name);
                
                return (
                  <div
                    key={`${name}-${index}`}
                    className={`
                      p-3 rounded-lg border text-center font-semibold transition-all duration-500 transform pointer-events-none
                      ${isEliminated 
                        ? 'bg-red-500/20 border-red-500/30 text-red-400 scale-75 opacity-30 line-through' 
                        : isWinner && eliminatedNames.size === animationNames.length - finalWinners.length
                        ? 'bg-green-500/20 border-green-500/30 text-green-400 scale-110 animate-pulse shadow-lg' 
                        : 'bg-primary/10 border-primary/30 text-primary'
                      }
                    `}
                  >
                    <div className="text-sm truncate">{name}</div>
                    {isEliminated && (
                      <div className="text-xs mt-1 text-red-400">Eliminated</div>
                    )}
                    {isWinner && eliminatedNames.size === animationNames.length - finalWinners.length && (
                      <div className="text-xs mt-1 text-green-400 font-bold">WINNER! 🎉</div>
                    )}
                  </div>
                );
              })}
            </div>

            {eliminatedNames.size === animationNames.length - finalWinners.length && (
              <div className="text-center mt-6 animate-fade-in">
                <div className="text-2xl font-bold text-green-500 mb-2">
                  🎉 Congratulations to the Winners! 🎉
                </div>
                <div className="text-lg text-muted-foreground mb-4">
                  {finalWinners.join(', ')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Winners have been marked as completed! All participants remain in the list.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}