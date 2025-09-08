import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Trophy, Clock } from "lucide-react";

interface SlotsCall {
  id: string;
  event_id: string;
  viewer_username: string;
  slot_name: string;
  bet_amount: number;
  win_amount?: number;
  multiplier?: number;
  status: string;
  submitted_at: string;
  call_order: number;
}

interface SlotsEvent {
  id: string;
  title: string;
  bet_size: number;
  status: string;
}

interface SlotsOverlayProps {
  userId?: string;
  maxCalls?: number;
}

interface OverlaySettings {
  background_color: string;
  border_color: string;
  text_color: string;
  accent_color: string;
  font_size: string;
  max_visible_calls: number;
  scrolling_speed: number;
  show_background: boolean;
  show_borders: boolean;
  animation_enabled: boolean;
}

export default function SlotsOverlay({ userId, maxCalls = 10 }: SlotsOverlayProps) {
  const [calls, setCalls] = useState<SlotsCall[]>([]);
  const [event, setEvent] = useState<SlotsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
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

  useEffect(() => {
    if (userId) {
      fetchOverlaySettings();
      fetchActiveEventAndCalls();
      
      // Set up real-time subscription for events and calls
      const eventsSubscription = supabase
        .channel('slots_events_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slots_events',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchActiveEventAndCalls();
          }
        )
        .subscribe();

      const callsSubscription = supabase
        .channel('slots_calls_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slots_calls'
          },
          (payload: any) => {
            // Only update if it's for the current active event
            if (event && payload.new && (payload.new as any).event_id === event.id) {
              fetchActiveEventAndCalls();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(eventsSubscription);
        supabase.removeChannel(callsSubscription);
      };
    }
  }, [userId, event?.id]);

  // Infinite cascade scroll effect for OBS overlay
  useEffect(() => {
    if (calls.length > (overlaySettings.max_visible_calls || maxCalls) && overlaySettings.animation_enabled) {
      const interval = setInterval(() => {
        setScrollPosition(prev => {
          // Smooth continuous scroll - move by small increments
          const newPosition = prev + 1;
          // Reset to 0 when we've scrolled past all items to create infinite loop
          const maxScroll = calls.length * 60; // Assuming ~60px per call item
          return newPosition >= maxScroll ? 0 : newPosition;
        });
      }, overlaySettings.scrolling_speed || 50); // Use user-defined scrolling speed

      return () => clearInterval(interval);
    } else {
      setScrollPosition(0);
    }
  }, [calls.length, overlaySettings.max_visible_calls, maxCalls, overlaySettings.animation_enabled]);

  const fetchOverlaySettings = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('overlay_settings')
        .select('*')
        .eq('user_id', userId)
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

  const fetchActiveEventAndCalls = async () => {
    if (!userId) return;

    try {
      console.log(`🔍 Fetching secure overlay data for userId: ${userId}`);
      
      // Use secure function that only returns essential overlay data
      const { data: eventData, error: eventError } = await supabase
        .rpc('get_secure_overlay_event');

      console.log(`📊 Secure event query result:`, { eventData, eventError });

      if (eventError) {
        console.error("Error fetching secure overlay event:", eventError);
        setEvent(null);
        setCalls([]);
        setLoading(false);
        return;
      }

      if (!eventData || eventData.length === 0) {
        setEvent(null);
        setCalls([]);
        setLoading(false);
        return;
      }

      // Map secure event data to expected format
      const secureEvent = eventData[0];
      setEvent({
        id: secureEvent.event_id,
        title: secureEvent.event_title,
        bet_size: 0, // Hide bet size for security
        status: secureEvent.event_status
      });

      // Use the secure overlay function that only exposes non-sensitive data
      const { data: callsData, error: callsError } = await supabase
        .rpc('get_overlay_slots_calls');

      if (callsError) {
        console.error("Error fetching calls:", callsError);
        setCalls([]);
      } else {
        // Filter calls for the current event since the function returns all active calls
        const eventCalls = callsData?.filter((call: any) => call.event_id === secureEvent.event_id) || [];
        // Map the secure data to the expected format (without sensitive fields)
        const mappedCalls = eventCalls.map((call: any) => ({
          id: call.id,
          event_id: call.event_id,
          viewer_username: 'Anonymous', // Don't expose usernames for security
          slot_name: call.slot_name,
          bet_amount: 0, // Don't expose bet amounts for security
          win_amount: undefined, // Don't expose win amounts for security
          multiplier: undefined, // Don't expose multipliers for security
          status: call.status,
          submitted_at: call.submitted_at,
          call_order: call.call_order,
        }));
        setCalls(mappedCalls);
      }
      
    } catch (error) {
      console.error("Error fetching overlay data:", error);
      setEvent(null);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
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

  const getFontSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getOverlayStyle = () => ({
    backgroundColor: overlaySettings.show_background ? overlaySettings.background_color : 'transparent',
    borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent',
    color: overlaySettings.text_color
  });

  if (!userId) {
    return (
      <div className="w-full max-w-md mx-auto bg-background/95 backdrop-blur-sm border rounded-lg p-6 text-center">
        <Dices className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Invalid overlay URL</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto rounded-lg p-6 text-center" style={getOverlayStyle()}>
        <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mx-auto" />
        <p className="mt-2" style={{color: overlaySettings.text_color}}>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-md mx-auto rounded-lg p-6 text-center" style={getOverlayStyle()}>
        <Dices className="h-8 w-8 mx-auto mb-2" style={{color: overlaySettings.accent_color}} />
        <p style={{color: overlaySettings.text_color}}>No active events</p>
      </div>
    );
  }

  const winner = event?.status === 'completed' ? getWinner() : null;

  // Create duplicated calls for infinite scroll effect when needed
  const infiniteScrollCalls = calls.length > (overlaySettings.max_visible_calls || maxCalls) 
    ? [...calls, ...calls] // Duplicate the calls array for seamless loop
    : calls;

  // Since we no longer have access to financial data for security reasons, 
  // we'll display a basic status summary instead
  const totalCalls = calls.length;
  const completedCalls = calls.filter(call => call.status === 'completed').length;
  const pendingCalls = calls.filter(call => call.status === 'pending').length;

  return (
    <div className={`w-full max-w-md mx-auto space-y-4 font-sans ${getFontSizeClass(overlaySettings.font_size)}`}>
      {/* Summary Section - Non-financial data only for security */}
      {calls.length > 0 && (
        <Card 
          className={`backdrop-blur-sm ${overlaySettings.show_borders ? 'border' : 'border-transparent'}`}
          style={{
            ...getOverlayStyle(),
            background: overlaySettings.show_background ? 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))' : 'transparent'
          }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Total Calls</div>
                <div className="font-bold" style={{color: overlaySettings.accent_color}}>{totalCalls}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Completed</div>
                <div className="font-bold text-green-400">{completedCalls}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Pending</div>
                <div className="font-bold text-orange-400">{pendingCalls}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Progress</div>
                <div className="font-bold" style={{color: overlaySettings.accent_color}}>
                  {totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Event Header */}
      <Card 
        className={`backdrop-blur-sm ${overlaySettings.show_borders ? 'border' : 'border-transparent'}`}
        style={getOverlayStyle()}
      >
        <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Dices className="h-6 w-6" style={{color: overlaySettings.accent_color}} />
              <div className="flex-1">
                <h2 className="font-bold text-lg" style={{color: overlaySettings.text_color}}>{event.title}</h2>
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <span style={{color: overlaySettings.text_color}}>
                    {event.status === 'closed' ? 'Entry Closed - Drawing Soon!' : 'Event Active'}
                  </span>
                  <Badge
                    className={
                      event.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      event.status === 'closed' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-blue-500/20 text-blue-300'
                    }
                  >
                    {event.status === 'closed' ? 'Entry Closed' : event.status}
                  </Badge>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Winner Display - Disabled for security as we don't have access to win data */}
      {/* Winner section removed to protect sensitive gambling data */}

      {/* Calls Queue */}
      <Card 
        className={`backdrop-blur-sm ${overlaySettings.show_borders ? 'border' : 'border-transparent'}`}
        style={getOverlayStyle()}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" style={{color: overlaySettings.accent_color}} />
            <h3 className="font-semibold" style={{color: overlaySettings.text_color}}>Calls Queue ({calls.length})</h3>
          </div>
          
          {calls.length === 0 ? (
            <p className="text-center py-4 text-sm opacity-70" style={{color: overlaySettings.text_color}}>
              No calls yet
            </p>
          ) : (
            <div 
              className="relative overflow-hidden"
              style={{ height: `${(overlaySettings.max_visible_calls || maxCalls) * 60}px` }}
            >
              <div 
                ref={scrollContainerRef}
                className="space-y-2 transition-transform duration-75 ease-linear"
                style={{
                  transform: `translateY(-${scrollPosition}px)`,
                  willChange: 'transform'
                }}
              >
                {infiniteScrollCalls.map((call, index) => (
                  <div
                    key={`${call.id}-${Math.floor(index / calls.length)}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${overlaySettings.show_borders ? 'border border-opacity-50' : ''} transition-all duration-500`}
                    style={{
                      backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent',
                      minHeight: '56px' // Consistent height for smooth scrolling
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="text-xs font-mono px-2 py-1 rounded whitespace-nowrap"
                          style={{
                            backgroundColor: overlaySettings.accent_color + '40',
                            color: overlaySettings.accent_color
                          }}
                        >
                          #{(index % calls.length) + 1}
                        </span>
                        <span className="font-semibold text-sm truncate max-w-[80px]" style={{color: overlaySettings.text_color}}>{call.viewer_username}</span>
                        <span style={{color: overlaySettings.text_color}}>→</span>
                        <span className="font-medium text-sm break-words flex-1 min-w-0" style={{color: overlaySettings.accent_color}}>{call.slot_name}</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-2 flex-wrap" style={{color: overlaySettings.text_color, opacity: 0.8}}>
                        {call.status === 'completed' ? (
                          <Badge className="bg-green-500/20 text-green-300 text-xs px-1 py-0">
                            Completed
                          </Badge>
                        ) : (
                          <Badge className={`${getStatusColor(call.status)} text-xs px-1 py-0`}>
                            {call.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gradient overlay for smooth fade effect */}
              <div 
                className="absolute top-0 left-0 right-0 h-4 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${overlaySettings.background_color}, transparent)`
                }}
              />
              <div 
                className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
                style={{
                  background: `linear-gradient(to top, ${overlaySettings.background_color}, transparent)`
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}