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
  show_background: boolean;
  show_borders: boolean;
  animation_enabled: boolean;
}

export default function SlotsOverlay({ userId, maxCalls = 10 }: SlotsOverlayProps) {
  const [calls, setCalls] = useState<SlotsCall[]>([]);
  const [event, setEvent] = useState<SlotsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
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

  // Auto-scroll effect for OBS overlay
  useEffect(() => {
    if (calls.length > (overlaySettings.max_visible_calls || maxCalls) && overlaySettings.animation_enabled) {
      const interval = setInterval(() => {
        setScrollOffset(prev => {
          const maxOffset = calls.length - (overlaySettings.max_visible_calls || maxCalls);
          return prev >= maxOffset ? 0 : prev + 1;
        });
      }, 3000); // Scroll every 3 seconds

      return () => clearInterval(interval);
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
      console.log(`🔍 Fetching active event for userId: ${userId}`);
      
      // Fetch active event for this user
      const { data: eventData, error: eventError } = await supabase
        .from('slots_events')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      console.log(`📊 Event query result:`, { eventData, eventError });

      if (eventError && eventError.code !== 'PGRST116') {
        console.error("Error fetching active event:", eventError);
        setEvent(null);
        setCalls([]);
        setLoading(false);
        return;
      }

      if (!eventData) {
        setEvent(null);
        setCalls([]);
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch calls for the active event
      const { data: callsData, error: callsError } = await supabase
        .from('slots_calls')
        .select('*')
        .eq('event_id', eventData.id)
        .order('call_order', { ascending: true });

      if (callsError) {
        console.error("Error fetching calls:", callsError);
        setCalls([]);
      } else {
        setCalls(callsData || []);
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

  const displayCalls = calls.slice(scrollOffset, scrollOffset + (overlaySettings.max_visible_calls || maxCalls));
  const winner = event?.status === 'completed' ? getWinner() : null;

  // Calculate totals for summary
  const totalCost = calls.reduce((sum, call) => sum + call.bet_amount, 0);
  const totalWinnings = calls
    .filter(call => call.status === 'completed' && call.win_amount)
    .reduce((sum, call) => sum + (call.win_amount || 0), 0);
  const overallMultiplier = totalCost > 0 ? totalWinnings / totalCost : 0;
  const totalProfit = totalWinnings - totalCost;

  return (
    <div className={`w-full max-w-md mx-auto space-y-4 font-sans ${getFontSizeClass(overlaySettings.font_size)}`}>
      {/* Summary Section */}
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
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Total Cost</div>
                <div className="font-bold" style={{color: overlaySettings.accent_color}}>${totalCost.toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Total Winnings</div>
                <div className="font-bold text-green-400">${totalWinnings.toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Total Multiplier</div>
                <div className={`font-bold ${overallMultiplier >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                  {overallMultiplier.toFixed(2)}x
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Net P/L</div>
                <div className={`font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
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
                <span style={{color: overlaySettings.text_color}}>Bet: ${event.bet_size}</span>
                <Badge 
                  className={
                    event.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    event.status === 'closed' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }
                >
                  {event.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winner Display */}
      {winner && (
        <Card 
          className={`backdrop-blur-sm ${overlaySettings.show_borders ? 'border-yellow-500/50' : 'border-transparent'}`}
          style={{
            ...getOverlayStyle(),
            background: overlaySettings.show_background ? 'linear-gradient(to right, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.2))' : 'transparent'
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <div>
                <h3 className="font-bold text-yellow-400">🏆 Winner: {winner.viewer_username}</h3>
                <p className="text-sm text-yellow-300">
                  {winner.slot_name} • {winner.multiplier?.toFixed(2)}x • ${winner.win_amount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          
          {displayCalls.length === 0 ? (
            <p className="text-center py-4 text-sm opacity-70" style={{color: overlaySettings.text_color}}>
              No calls yet
            </p>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="space-y-2 transition-all duration-1000 ease-in-out"
              style={{
                transform: `translateY(0px)` // Smooth auto-scroll
              }}
            >
              {displayCalls.map((call, index) => (
                <div
                  key={`${call.id}-${scrollOffset}`}
                  className={`flex items-center justify-between p-3 rounded-lg ${overlaySettings.show_borders ? 'border border-opacity-50' : ''} transition-all duration-500 ${overlaySettings.animation_enabled ? 'animate-fade-in' : ''}`}
                  style={{
                    backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
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
                        #{scrollOffset + index + 1}
                      </span>
                      <span className="font-semibold text-sm truncate max-w-[80px]" style={{color: overlaySettings.text_color}}>{call.viewer_username}</span>
                      <span style={{color: overlaySettings.text_color}}>→</span>
                      <span className="font-medium text-sm break-words flex-1 min-w-0" style={{color: overlaySettings.accent_color}}>{call.slot_name}</span>
                    </div>
                    <div className="text-xs mt-1 flex items-center gap-2 flex-wrap" style={{color: overlaySettings.text_color, opacity: 0.8}}>
                      <span className="whitespace-nowrap">${call.bet_amount} bet</span>
                      <span>•</span>
                      {call.status === 'completed' ? (
                        <span className="text-green-400 whitespace-nowrap">
                          ${call.win_amount} ({call.multiplier?.toFixed(2)}x)
                        </span>
                      ) : (
                        <Badge className={`${getStatusColor(call.status)} text-xs px-1 py-0`}>
                          {call.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {calls.length > (overlaySettings.max_visible_calls || maxCalls) && (
                <div className="text-center py-2 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, Math.ceil(calls.length / (overlaySettings.max_visible_calls || maxCalls))) }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === Math.floor(scrollOffset / (overlaySettings.max_visible_calls || maxCalls)) 
                              ? 'bg-current' 
                              : 'bg-current opacity-30'
                          }`}
                          style={{ color: overlaySettings.accent_color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs opacity-70 ml-2" style={{color: overlaySettings.text_color}}>
                      Showing {scrollOffset + 1}-{Math.min(scrollOffset + (overlaySettings.max_visible_calls || maxCalls), calls.length)} of {calls.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}