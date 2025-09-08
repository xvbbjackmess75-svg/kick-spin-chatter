import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Trophy, Clock, TrendingUp } from "lucide-react";

interface BonusHuntBet {
  id: string;
  session_id: string;
  slot_name: string;
  bet_size: number;
  bonus_multiplier?: number;
  pnl: number;
  created_at: string;
  payout_amount?: number;
  payout_recorded_at?: string;
}

interface BonusHuntSession {
  id: string;
  session_name?: string;
  starting_balance: number;
  current_balance: number;
  status: string;
  bonus_opening_phase?: boolean;
}

interface BonusHuntOverlayProps {
  userId?: string;
  maxBonuses?: number;
}

interface BonusHuntOverlaySettings {
  background_color: string;
  border_color: string;
  text_color: string;
  accent_color: string;
  font_size: string;
  max_visible_bonuses: number;
  scrolling_speed: number;
  show_background: boolean;
  show_borders: boolean;
  animation_enabled: boolean;
  show_upcoming_bonuses: boolean;
  show_top_multipliers: boolean;
  show_expected_payouts: boolean;
}

export default function BonusHuntOverlay({ userId, maxBonuses = 5 }: BonusHuntOverlayProps) {
  const [bonuses, setBonuses] = useState<BonusHuntBet[]>([]);
  const [session, setSession] = useState<BonusHuntSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [overlaySettings, setOverlaySettings] = useState<BonusHuntOverlaySettings>({
    background_color: 'rgba(0, 0, 0, 0.95)',
    border_color: '#3b82f6',
    text_color: '#ffffff',
    accent_color: '#3b82f6',
    font_size: 'medium',
    max_visible_bonuses: 5,
    scrolling_speed: 50,
    show_background: true,
    show_borders: true,
    animation_enabled: true,
    show_upcoming_bonuses: true,
    show_top_multipliers: true,
    show_expected_payouts: true
  });

  useEffect(() => {
    if (userId) {
      fetchOverlaySettings();
      fetchActiveSessionAndBonuses();
      
      // Set up real-time subscription for sessions and bets
      const sessionsSubscription = supabase
        .channel('bonus_hunt_sessions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bonus_hunt_sessions',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchActiveSessionAndBonuses();
          }
        )
        .subscribe();

      const betsSubscription = supabase
        .channel('bonus_hunt_bets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bonus_hunt_bets'
          },
          (payload: any) => {
            // Only update if it's for the current active session
            if (session && payload.new && (payload.new as any).session_id === session.id) {
              fetchActiveSessionAndBonuses();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(sessionsSubscription);
        supabase.removeChannel(betsSubscription);
      };
    }
  }, [userId, session?.id]);

  // Infinite cascade scroll effect for OBS overlay
  useEffect(() => {
    if (bonuses.length > (overlaySettings.max_visible_bonuses || maxBonuses) && overlaySettings.animation_enabled) {
      const interval = setInterval(() => {
        setScrollPosition(prev => {
          // Smooth continuous scroll - move by small increments
          const newPosition = prev + 1;
          // Reset to 0 when we've scrolled past all items to create infinite loop
          const maxScroll = bonuses.length * 80; // Assuming ~80px per bonus item
          return newPosition >= maxScroll ? 0 : newPosition;
         });
       }, overlaySettings.scrolling_speed || 50); // Use user-defined scrolling speed

       return () => clearInterval(interval);
    } else {
      setScrollPosition(0);
    }
  }, [bonuses.length, overlaySettings.max_visible_bonuses, maxBonuses, overlaySettings.animation_enabled]);

  const fetchOverlaySettings = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('bonus_hunt_overlay_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error("Error fetching overlay settings:", error);
        return;
      }

      if (data) {
        setOverlaySettings({
          background_color: data.background_color || 'rgba(0, 0, 0, 0.95)',
          border_color: (data as any).border_color || '#3b82f6',
          text_color: data.text_color || '#ffffff',
          accent_color: data.accent_color || '#3b82f6',
          font_size: data.font_size || 'medium',
          max_visible_bonuses: data.max_visible_bonuses || 5,
          scrolling_speed: (data as any).scrolling_speed || 50,
          show_background: (data as any).show_background ?? true,
          show_borders: (data as any).show_borders ?? true,
          animation_enabled: data.animation_enabled ?? true,
          show_upcoming_bonuses: data.show_upcoming_bonuses ?? true,
          show_top_multipliers: data.show_top_multipliers ?? true,
          show_expected_payouts: data.show_expected_payouts ?? true
        });
      }
    } catch (error) {
      console.error("Error fetching overlay settings:", error);
    }
  };

  const fetchActiveSessionAndBonuses = async () => {
    if (!userId) return;

    try {
      console.log(`🔍 Fetching active session for userId: ${userId}`);
      
      // Fetch active session for this user
      const { data: sessionData, error: sessionError } = await supabase
        .from('bonus_hunt_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      console.log(`📊 Session query result:`, { sessionData, sessionError });

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error("Error fetching active session:", sessionError);
        setSession(null);
        setBonuses([]);
        setLoading(false);
        return;
      }

      if (!sessionData) {
        setSession(null);
        setBonuses([]);
        setLoading(false);
        return;
      }

      setSession(sessionData);

      // Fetch bonuses for the active session
      const { data: bonusesData, error: bonusesError } = await supabase
        .from('bonus_hunt_bets')
        .select(`
          id,
          session_id,
          bet_size,
          bonus_multiplier,
          pnl,
          created_at,
          payout_amount,
          payout_recorded_at,
          slots!slot_id (
            name
          )
        `)
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: false });

      if (bonusesError) {
        console.error("Error fetching bonuses:", bonusesError);
        setBonuses([]);
      } else {
        // Map the data to the expected format
        const mappedBonuses = bonusesData?.map((bonus: any) => ({
          id: bonus.id,
          session_id: bonus.session_id,
          slot_name: bonus.slots?.name || 'Unknown Slot',
          bet_size: bonus.bet_size,
          bonus_multiplier: bonus.bonus_multiplier,
          pnl: bonus.pnl,
          created_at: bonus.created_at,
          payout_amount: bonus.payout_amount,
          payout_recorded_at: bonus.payout_recorded_at
        })) || [];
        setBonuses(mappedBonuses);
      }
      
    } catch (error) {
      console.error("Error fetching overlay data:", error);
      setSession(null);
      setBonuses([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (bonus: BonusHuntBet) => {
    if (bonus.payout_recorded_at) {
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
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
        <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
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

  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto rounded-lg p-6 text-center" style={getOverlayStyle()}>
        <Gift className="h-8 w-8 mx-auto mb-2" style={{color: overlaySettings.accent_color}} />
        <p style={{color: overlaySettings.text_color}}>No active bonus hunt</p>
      </div>
    );
  }

  // Create duplicated bonuses for infinite scroll effect when needed
  const infiniteScrollBonuses = bonuses.length > (overlaySettings.max_visible_bonuses || maxBonuses) 
    ? [...bonuses, ...bonuses] // Duplicate the bonuses array for seamless loop
    : bonuses;

  const totalBonuses = bonuses.length;
  const completedBonuses = bonuses.filter(bonus => bonus.payout_recorded_at).length;
  const pendingBonuses = bonuses.filter(bonus => !bonus.payout_recorded_at).length;
  
  // Calculate stats based on starting balance vs total spent and payouts
  const totalBetAmount = bonuses.reduce((sum, bonus) => sum + bonus.bet_size, 0);
  const totalPayouts = bonuses.reduce((sum, bonus) => sum + (bonus.payout_amount || 0), 0);
  
  // PNL = total payouts received - starting balance (what we started with)
  const totalPnL = session ? totalPayouts - session.starting_balance : 0;
  
  // Calculate current avg multiplier - only from opened bonuses
  const openedBonuses = bonuses.filter(bonus => bonus.payout_amount !== null && bonus.payout_amount !== undefined);
  const openedBetAmount = openedBonuses.reduce((sum, bonus) => sum + bonus.bet_size, 0);
  const openedPayouts = openedBonuses.reduce((sum, bonus) => sum + (bonus.payout_amount || 0), 0);
  const avgMultiplier = openedBetAmount > 0 ? openedPayouts / openedBetAmount : 0;
  
  // Calculate required average multiplier to break even from starting balance
  const requiredAvgMulti = totalBetAmount > 0 && session ? session.starting_balance / totalBetAmount : 0;
  const isProfit = totalPnL > 0;

  return (
    <div className={`w-full max-w-md mx-auto space-y-4 font-sans ${getFontSizeClass(overlaySettings.font_size)}`}>
      {/* Session Header */}
      <Card 
        className={`backdrop-blur-sm ${overlaySettings.show_borders ? 'border' : 'border-transparent'}`}
        style={getOverlayStyle()}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6" style={{color: overlaySettings.accent_color}} />
            <div className="flex-1">
              <h2 className="font-bold text-lg" style={{color: overlaySettings.text_color}}>
                {session.session_name || 'Bonus Hunt'}
              </h2>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <span style={{color: overlaySettings.text_color}}>
                    Balance: ${session.current_balance?.toFixed(2)}
                  </span>
                  <Badge 
                    className={
                      session.bonus_opening_phase ? 'bg-purple-500/20 text-purple-300' :
                      session.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }
                  >
                    {session.bonus_opening_phase ? 'Opening Bonuses' : session.status}
                  </Badge>
                </div>
                {/* Stats under balance */}
                <div className="grid grid-cols-3 gap-3 text-xs mt-2">
                  <div>
                    <div style={{color: overlaySettings.text_color, opacity: 0.7}}>Required Average</div>
                    <div className="font-semibold" style={{color: overlaySettings.accent_color}}>
                      {requiredAvgMulti.toFixed(1)}x
                    </div>
                  </div>
                  <div>
                    <div style={{color: overlaySettings.text_color, opacity: 0.7}}>Starting Balance</div>
                    <div className="font-semibold text-green-400">
                      ${session.starting_balance.toFixed(2)}
                    </div>
                  </div>
                   <div>
                     <div style={{color: overlaySettings.text_color, opacity: 0.7}}>Req Avg Mult</div>
                     <div className={`font-semibold ${isProfit ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isProfit ? 'Profit' : `${requiredAvgMulti.toFixed(1)}x`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currently Opening Bonus */}
      {session?.bonus_opening_phase && bonuses.length > 0 && (
        <Card 
          className={`backdrop-blur-sm ${overlaySettings.show_borders ? 'border' : 'border-transparent'}`}
          style={getOverlayStyle()}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4" style={{color: overlaySettings.accent_color}} />
              <h3 className="font-semibold" style={{color: overlaySettings.text_color}}>Currently Opening</h3>
            </div>
            {(() => {
              const nextBonusToOpen = bonuses.find(bonus => !bonus.payout_recorded_at);
              return nextBonusToOpen ? (
                <div className="p-3 rounded-lg" style={{
                  backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
                }}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{color: overlaySettings.accent_color}}>
                      {nextBonusToOpen.slot_name}
                    </span>
                    <span style={{color: overlaySettings.text_color}}>•</span>
                    <span className="text-sm" style={{color: overlaySettings.text_color}}>
                      ${nextBonusToOpen.bet_size.toFixed(2)} spin
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center py-2 text-sm opacity-70" style={{color: overlaySettings.text_color}}>
                  All bonuses opened!
                </p>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Bonuses Queue */}
      <Card 
        className={`backdrop-blur-sm ${overlaySettings.show_borders ? 'border' : 'border-transparent'}`}
        style={getOverlayStyle()}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" style={{color: overlaySettings.accent_color}} />
            <h3 className="font-semibold" style={{color: overlaySettings.text_color}}>
              Bonus Queue ({bonuses.length})
            </h3>
          </div>
          
          {bonuses.length === 0 ? (
            <p className="text-center py-4 text-sm opacity-70" style={{color: overlaySettings.text_color}}>
              No bonuses yet
            </p>
          ) : (
            <div 
              className="relative overflow-hidden"
              style={{ height: `${(overlaySettings.max_visible_bonuses || maxBonuses) * 80}px` }}
            >
              <div 
                ref={scrollContainerRef}
                className="space-y-2 transition-transform duration-75 ease-linear"
                style={{
                  transform: `translateY(-${scrollPosition}px)`,
                  willChange: 'transform'
                }}
              >
                {infiniteScrollBonuses.map((bonus, index) => (
                   <div
                     key={`${bonus.id}-${Math.floor(index / bonuses.length)}`}
                     className={`flex items-center justify-between p-3 rounded-lg ${overlaySettings.show_borders ? 'border border-opacity-50' : ''} transition-all duration-500`}
                     style={{
                       backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                       borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent',
                       minHeight: '72px' // Consistent height for smooth scrolling
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
                           #{(index % bonuses.length) + 1}
                         </span>
                         <span className="font-medium text-sm break-words flex-1 min-w-0" style={{color: overlaySettings.accent_color}}>
                           {bonus.slot_name}
                         </span>
                         {bonus.payout_recorded_at && (
                           <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">
                             Opened
                           </span>
                         )}
                       </div>
                       <div className="text-xs mt-1 flex items-center gap-2 flex-wrap" style={{color: overlaySettings.text_color, opacity: 0.8}}>
                         <Badge className={`${getStatusColor(bonus)} text-xs px-1 py-0`}>
                           {bonus.payout_recorded_at ? 'Opened' : 'Pending'}
                         </Badge>
                         {bonus.payout_amount && (
                           <span className="text-green-400">
                             ${bonus.payout_amount.toFixed(2)}
                           </span>
                         )}
                         {bonus.bonus_multiplier && (
                           <span className="text-yellow-400">
                             {bonus.bonus_multiplier.toFixed(2)}x
                           </span>
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
                   background: overlaySettings.show_background ? `linear-gradient(to bottom, ${overlaySettings.background_color}, transparent)` : 'transparent'
                 }}
               />
               <div 
                 className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
                 style={{
                   background: overlaySettings.show_background ? `linear-gradient(to top, ${overlaySettings.background_color}, transparent)` : 'transparent'
                 }}
               />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}