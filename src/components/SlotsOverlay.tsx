import { useState, useEffect } from "react";
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
  eventId?: string;
  maxCalls?: number;
}

export default function SlotsOverlay({ eventId, maxCalls = 10 }: SlotsOverlayProps) {
  const [calls, setCalls] = useState<SlotsCall[]>([]);
  const [event, setEvent] = useState<SlotsEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventAndCalls();
      
      // Set up real-time subscription for calls
      const callsSubscription = supabase
        .channel('slots_calls_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slots_calls',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            fetchEventAndCalls();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(callsSubscription);
      };
    }
  }, [eventId]);

  const fetchEventAndCalls = async () => {
    if (!eventId) return;

    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('slots_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch calls
      const { data: callsData, error: callsError } = await supabase
        .from('slots_calls')
        .select('*')
        .eq('event_id', eventId)
        .order('call_order', { ascending: true });

      if (callsError) throw callsError;
      setCalls(callsData || []);
      
    } catch (error) {
      console.error("Error fetching overlay data:", error);
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

  if (!eventId) {
    return (
      <div className="w-full max-w-md mx-auto bg-background/95 backdrop-blur-sm border rounded-lg p-6 text-center">
        <Dices className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No active slots event</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto bg-background/95 backdrop-blur-sm border rounded-lg p-6 text-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground mt-2">Loading...</p>
      </div>
    );
  }

  const displayCalls = calls.slice(0, maxCalls);
  const winner = event?.status === 'completed' ? getWinner() : null;

  return (
    <div className="w-full max-w-md mx-auto space-y-4 font-sans">
      {/* Event Header */}
      {event && (
        <Card className="bg-background/95 backdrop-blur-sm border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Dices className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <h2 className="font-bold text-lg">{event.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Bet: ${event.bet_size}</span>
                  <Badge className={
                    event.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    event.status === 'closed' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }>
                    {event.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winner Display */}
      {winner && (
        <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50">
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
      <Card className="bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Calls Queue ({calls.length})</h3>
          </div>
          
          {displayCalls.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">
              No calls yet
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {displayCalls.map((call, index) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-sm">{call.viewer_username}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-primary font-medium text-sm">{call.slot_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ${call.bet_amount} bet • 
                      {call.status === 'completed' ? (
                        <span className="text-green-400 ml-1">
                          ${call.win_amount} ({call.multiplier?.toFixed(2)}x)
                        </span>
                      ) : (
                        <Badge className={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {calls.length > maxCalls && (
                <div className="text-center py-2">
                  <span className="text-xs text-muted-foreground">
                    +{calls.length - maxCalls} more calls
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}