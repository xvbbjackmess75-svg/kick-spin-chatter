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
import { Dices, Trophy, Play, Square, Clock, Users, Target, ExternalLink, Copy, Settings, Palette } from "lucide-react";

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
  const { toast } = useToast();
  
  const [events, setEvents] = useState<SlotsEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SlotsEvent | null>(null);
  const [calls, setCalls] = useState<SlotsCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [maxCallsPerUser, setMaxCallsPerUser] = useState(1);
  const [betSize, setBetSize] = useState("");
  const [prize, setPrize] = useState("");
  const [autoStartMonitoring, setAutoStartMonitoring] = useState(false);
  
  // Overlay customization states
  const [overlaySettings, setOverlaySettings] = useState({
    background_color: 'rgba(0, 0, 0, 0.95)',
    border_color: '#3b82f6',
    text_color: '#ffffff',
    accent_color: '#3b82f6',
    font_size: 'medium',
    max_visible_calls: 10,
    show_background: true,
    show_borders: true,
    animation_enabled: true
  });
  
  // Result input states
  const [winAmount, setWinAmount] = useState("");
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  
  // WebSocket for chat monitoring
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchOverlaySettings();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      fetchCalls(selectedEvent.id);
    }
  }, [selectedEvent]);

  // Initialize WebSocket connection for chat monitoring
  const initializeWebSocket = () => {
    if (!canUseChatbot || !kickUser) {
      toast({
        title: "Error",
        description: "Please link your Kick account to use chat monitoring",
        variant: "destructive",
      });
      return;
    }

    try {
      const wsUrl = `wss://xdjtgkgwtsdpfftrrouz.supabase.co/functions/v1/kick-chat-monitor`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("Connected to chat monitor");
        setIsMonitoring(true);
        
        // Join the channel for monitoring
        if (kickUser) {
          const joinMessage = {
            type: 'join_channel',
            channel: kickUser
          };
          socketRef.current?.send(JSON.stringify(joinMessage));
        }
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message' && data.message?.startsWith('!kgs ')) {
          handleSlotsCallCommand(data);
        }
      };

      socketRef.current.onclose = () => {
        console.log("Disconnected from chat monitor");
        setIsMonitoring(false);
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsMonitoring(false);
      };

    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
    }
  };

  // Handle !kgs command from chat
  const handleSlotsCallCommand = async (data: any) => {
    if (!selectedEvent || selectedEvent.status !== 'active') return;

    const slotName = data.message.replace('!kgs ', '').trim();
    const username = data.sender?.username;
    const kickUserId = data.sender?.id?.toString();

    if (!slotName || !username) return;

    try {
      // Check if user has exceeded their call limit
      const { count: userCallsCount } = await supabase
        .from('slots_calls')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', selectedEvent.id)
        .eq('viewer_username', username);

      if ((userCallsCount || 0) >= selectedEvent.max_calls_per_user) {
        toast({
          title: "Call Limit Reached",
          description: `${username} has reached the maximum calls limit`,
          variant: "destructive",
        });
        return;
      }

      // Get next call order
      const { data: orderData } = await supabase
        .rpc('get_next_call_order', { event_uuid: selectedEvent.id });

      // Add the call to the database
      const { error } = await supabase
        .from('slots_calls')
        .insert({
          event_id: selectedEvent.id,
          viewer_username: username,
          viewer_kick_id: kickUserId,
          slot_name: slotName,
          bet_amount: selectedEvent.bet_size,
          status: 'pending',
          call_order: orderData || 1
        });

      if (error) throw error;

      toast({
        title: "Slots Call Added",
        description: `${username} called ${slotName}`,
      });

      // Refresh calls list
      if (selectedEvent) {
        fetchCalls(selectedEvent.id);
      }

    } catch (error) {
      console.error("Error processing slots call:", error);
    }
  };

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
      const { data, error } = await supabase
        .from('slots_calls')
        .select('*')
        .eq('event_id', eventId)
        .order('call_order', { ascending: true });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error("Error fetching calls:", error);
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
      const { error } = await supabase
        .from('slots_events')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          max_calls_per_user: maxCallsPerUser,
          bet_size: parseFloat(betSize),
          prize: prize.trim(),
          status: 'active',
          channel_id: typeof kickUser === 'string' ? kickUser : kickUser?.toString() || null
        });

      if (error) throw error;

      // Auto-start monitoring if checkbox was checked
      if (autoStartMonitoring) {
        // Initialize WebSocket if not already connected
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          initializeWebSocket();
        }
        
        // Give WebSocket time to connect
        setTimeout(() => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const joinMessage = {
              type: 'join_channel',
              channel: typeof kickUser === 'string' ? kickUser : kickUser?.toString() || ''
            };
            socketRef.current.send(JSON.stringify(joinMessage));
          }
        }, 1000);
      }

      const successMessage = autoStartMonitoring 
        ? `Event "${title}" created and monitoring started!`
        : `Event "${title}" created! Remember to start monitoring to track !kgs commands.`;

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
      fetchEvents();
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

      toast({
        title: "Success",
        description: `Event ${status}`,
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
    const userIdParam = userId || user?.id;
    return `${baseUrl}/overlay/slots?userId=${userIdParam}`;
  };

  const copyOverlayUrl = () => {
    const url = getOverlayUrl();
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Copied!",
        description: "Your personal overlay URL copied to clipboard",
      });
    });
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
          
          <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gaming-button">
                <Settings className="h-4 w-4 mr-2" />
                Customize Overlay
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Overlay Customization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={overlaySettings.background_color.includes('rgba') ? '#000000' : overlaySettings.background_color}
                    onChange={(e) => setOverlaySettings({...overlaySettings, background_color: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <Input
                    type="color"
                    value={overlaySettings.border_color}
                    onChange={(e) => setOverlaySettings({...overlaySettings, border_color: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={overlaySettings.text_color}
                    onChange={(e) => setOverlaySettings({...overlaySettings, text_color: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <Input
                    type="color"
                    value={overlaySettings.accent_color}
                    onChange={(e) => setOverlaySettings({...overlaySettings, accent_color: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select value={overlaySettings.font_size} onValueChange={(value) => setOverlaySettings({...overlaySettings, font_size: value})}>
                    <SelectTrigger>
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
                  />
                </div>
                
                <div className="space-y-3">
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
                
                <Button onClick={saveOverlaySettings} className="w-full gaming-button">
                  Save Settings
                </Button>
              </div>
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
                    max="10"
                    value={maxCallsPerUser}
                    onChange={(e) => setMaxCallsPerUser(parseInt(e.target.value) || 1)}
                  />
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
                    <Label htmlFor="auto-start-monitoring" className="text-sm font-medium">
                      Auto start chat monitoring
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, chat monitoring will start automatically after creating the event
                  </p>
                  
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
                  <div className="flex gap-2">
                    {selectedEvent.status === 'active' && (
                      <>
                        <Button
                          onClick={isMonitoring ? () => {
                            socketRef.current?.close();
                            setIsMonitoring(false);
                          } : initializeWebSocket}
                          variant={isMonitoring ? "destructive" : "default"}
                          size="sm"
                          className="gaming-button"
                        >
                          {isMonitoring ? (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => updateEventStatus(selectedEvent.id, 'closed')}
                          variant="outline"
                          size="sm"
                        >
                          Close Event
                        </Button>
                      </>
                    )}
                    {selectedEvent.status === 'closed' && (
                      <Button 
                        onClick={() => updateEventStatus(selectedEvent.id, 'completed')}
                        variant="outline"
                        size="sm"
                      >
                        Complete Event
                      </Button>
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
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Calls Queue ({calls.length})
                    </h3>
                    
                    {calls.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        No calls yet. {selectedEvent.status === 'active' ? 'Start monitoring to track !kgs commands.' : ''}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {calls.map((call, index) => (
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
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setSelectedCallId(call.id)}
                                      >
                                        Add Result
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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
    </div>
  );
}