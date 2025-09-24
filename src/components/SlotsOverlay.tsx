import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dices, Trophy, Clock, TrendingUp, Users, Target } from "lucide-react";

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
        .rpc('get_secure_overlay_event', { target_user_id: userId });

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
        .rpc('get_overlay_slots_calls', { target_user_id: userId });

      console.log('🔍 Raw calls data from function:', callsData);

      if (callsError) {
        console.error("Error fetching calls:", callsError);
        setCalls([]);
      } else {
        // Filter calls for the current event since the function returns all active calls
        const eventCalls = callsData?.filter((call: any) => call.event_id === secureEvent.event_id) || [];
        console.log('📊 Filtered event calls:', eventCalls);
        
        // Map the secure data to the expected format (now including usernames and financial data)
        const mappedCalls = eventCalls.map((call: any) => ({
          id: call.id,
          event_id: call.event_id,
          viewer_username: call.viewer_username,
          slot_name: call.slot_name,
          bet_amount: call.bet_amount,
          win_amount: call.win_amount,
          multiplier: call.multiplier,
          status: call.status,
          submitted_at: call.submitted_at,
          call_order: call.call_order,
        }));
        console.log('🎯 Mapped calls for overlay:', mappedCalls);
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

  const getTopCall = () => {
    // First try to get completed calls with both win_amount and multiplier
    const completedCallsWithWin = calls.filter(call => 
      call.status === 'completed' && call.multiplier && call.win_amount
    );
    
    if (completedCallsWithWin.length > 0) {
      return completedCallsWithWin.reduce((topCall, call) => {
        if (!topCall || (call.multiplier || 0) > (topCall.multiplier || 0)) {
          return call;
        }
        if (call.multiplier === topCall.multiplier && call.call_order < topCall.call_order) {
          return call;
        }
        return topCall;
      }, completedCallsWithWin[0]);
    }

    // If no calls with multiplier/win_amount, return null
    return null;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 rounded-lg" style={getOverlayStyle()}>
          <Dices className="h-12 w-12 mx-auto mb-4" style={{color: overlaySettings.accent_color}} />
          <p style={{color: overlaySettings.text_color}}>Invalid overlay URL</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8" style={getOverlayStyle()}>
          <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4" style={{borderColor: overlaySettings.accent_color, borderTopColor: 'transparent'}} />
          <p style={{color: overlaySettings.text_color}}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 rounded-lg" style={getOverlayStyle()}>
          <Dices className="h-12 w-12 mx-auto mb-4" style={{color: overlaySettings.accent_color}} />
          <p style={{color: overlaySettings.text_color}}>No active slots events</p>
        </div>
      </div>
    );
  }

  const topCall = getTopCall();
  const totalCalls = calls.length;
  const completedCalls = calls.filter(call => call.status === 'completed').length;
  const pendingCalls = calls.filter(call => call.status === 'pending').length;

  // Create duplicated calls for infinite scroll effect when needed
  const infiniteScrollCalls = calls.length > (overlaySettings.max_visible_calls || maxCalls) 
    ? [...calls, ...calls] // Duplicate the calls array for seamless loop
    : calls;

  return (
    <div 
      className={`min-h-screen p-6 ${getFontSizeClass(overlaySettings.font_size)}`} 
      style={getOverlayStyle()}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{color: overlaySettings.text_color}}>
            {event.title}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div 
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: event.status === 'active' ? '#22c55e' : event.status === 'closed' ? '#f59e0b' : '#8b5cf6',
                color: '#000000'
              }}
            >
              {event.status === 'active' ? 'Accepting Entries' : event.status === 'closed' ? 'Entry Closed - Drawing Soon!' : event.status}
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {/* Total Calls */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-3 w-3" style={{color: '#22c55e'}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Total</span>
            </div>
            <div className="text-sm font-bold" style={{color: '#22c55e'}}>
              {totalCalls}
            </div>
          </div>

          {/* Completed Calls */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="h-3 w-3" style={{color: overlaySettings.accent_color}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Done</span>
            </div>
            <div className="text-sm font-bold" style={{color: overlaySettings.text_color}}>
              {completedCalls}
            </div>
          </div>

          {/* Pending Calls */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3" style={{color: '#f59e0b'}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Pending</span>
            </div>
            <div className="text-sm font-bold" style={{color: overlaySettings.text_color}}>
              {pendingCalls}
            </div>
          </div>

          {/* Top Multiplier */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3" style={{color: topCall ? '#22c55e' : '#6b7280'}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Top Multi</span>
            </div>
            <div className="text-sm font-bold" style={{color: topCall ? '#22c55e' : overlaySettings.text_color}}>
              {topCall ? `${topCall.multiplier?.toFixed(1)}x` : '-'}
            </div>
          </div>
        </div>

        {/* Top Call Highlight */}
        {topCall && (
          <div className="mb-3">
            <h2 className="text-xs font-semibold mb-1" style={{color: overlaySettings.text_color}}>
              🏆 Top Call
            </h2>
            <div 
              className="p-2 rounded-md border-2 border-dashed"
              style={{
                backgroundColor: overlaySettings.show_background ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                borderColor: '#22c55e'
              }}
            >
              <div className="text-center">
                <div className="text-sm font-bold mb-0.5" style={{color: '#22c55e'}}>
                  {topCall.viewer_username}
                </div>
                <div className="text-xs mb-1" style={{color: overlaySettings.text_color}}>
                  {topCall.slot_name}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs" style={{color: overlaySettings.text_color, opacity: 0.8}}>
                  <span>Win: ${topCall.win_amount?.toFixed(0)}</span>
                  <span>•</span>
                  <span>Multiplier: {topCall.multiplier?.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calls Grid */}
        <div>
          <h2 className="text-sm font-semibold mb-2" style={{color: overlaySettings.text_color}}>
            Calls Queue ({calls.length})
          </h2>
          
          {calls.length === 0 ? (
            <div className="text-center py-12" style={{color: overlaySettings.text_color, opacity: 0.7}}>
              No calls submitted yet
            </div>
          ) : (
            <div 
              className="relative overflow-hidden rounded-xl"
              style={{ 
                height: `${(() => {
                  const visibleCalls = Math.min(calls.length, overlaySettings.max_visible_calls || maxCalls);
                  const itemHeight = 40; // even smaller for better fit
                  const spacing = Math.max(0, visibleCalls - 1) * 4; // space-y-1 between items
                  const containerPadding = 12; // p-1.5 top and bottom
                  return visibleCalls * itemHeight + spacing + containerPadding;
                })()}px`,
                backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border: overlaySettings.show_borders ? `1px solid ${overlaySettings.border_color}` : 'none'
              }}
            >
              <div 
                ref={scrollContainerRef}
                className="space-y-1 p-1.5 transition-transform duration-75 ease-linear"
                style={{
                  transform: `translateY(-${scrollPosition}px)`,
                  willChange: 'transform'
                }}
              >
                {infiniteScrollCalls.map((call, index) => (
                  <div
                    key={`${call.id}-${Math.floor(index / calls.length)}`}
                    className={`flex items-center justify-between p-1.5 rounded-sm transition-all duration-500 ${
                      overlaySettings.show_borders ? 'border border-opacity-30' : ''
                    }`}
                    style={{
                      backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent',
                      minHeight: '40px'
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span 
                        className="text-xs font-mono px-2 py-1 rounded-full font-bold min-w-[32px] text-center"
                        style={{
                          backgroundColor: overlaySettings.accent_color,
                          color: '#000000'
                        }}
                      >
                        #{(index % calls.length) + 1}
                      </span>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm" style={{color: overlaySettings.accent_color}}>
                            {call.viewer_username}
                          </span>
                          <Target className="h-3 w-3" style={{color: overlaySettings.text_color, opacity: 0.6}} />
                          <span className="font-medium text-xs" style={{color: overlaySettings.text_color}}>
                            {call.slot_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div 
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              call.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              call.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}
                          >
                            {call.status === 'completed' ? 'Done' : call.status === 'pending' ? 'Pending' : call.status}
                          </div>
                          
                          {call.status === 'completed' && call.win_amount && call.multiplier && (
                            <div className="flex items-center gap-1">
                              <span className="text-green-400 font-bold text-xs">
                                ${call.win_amount.toFixed(0)}
                              </span>
                              <span className="text-green-300 text-xs">
                                ({call.multiplier.toFixed(1)}x)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gradient overlays for smooth fade effect */}
              <div 
                className="absolute top-0 left-0 right-0 h-6 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${overlaySettings.background_color || 'rgba(0,0,0,0.95)'}, transparent)`
                }}
              />
              <div 
                className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                style={{
                  background: `linear-gradient(to top, ${overlaySettings.background_color || 'rgba(0,0,0,0.95)'}, transparent)`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}