import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Trophy, Clock, TrendingUp, DollarSign, Target } from "lucide-react";

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
          const maxScroll = bonuses.length * 60; // Assuming ~60px per bonus item
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
          <Gift className="h-12 w-12 mx-auto mb-4" style={{color: overlaySettings.accent_color}} />
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

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 rounded-lg" style={getOverlayStyle()}>
          <Gift className="h-12 w-12 mx-auto mb-4" style={{color: overlaySettings.accent_color}} />
          <p style={{color: overlaySettings.text_color}}>No active bonus hunt</p>
        </div>
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
  // We need to earn back: starting_balance + totalBetAmount to break even
  // So required multiplier = (starting_balance + totalBetAmount) / totalBetAmount
  const amountNeededToBreakEven = session ? session.starting_balance + totalBetAmount : 0;
  const requiredAvgMulti = totalBetAmount > 0 ? amountNeededToBreakEven / totalBetAmount : 0;
  const isProfit = totalPnL > 0;
  
  // Calculate profit percentage if in profit
  const profitPercentage = session && isProfit ? (totalPnL / session.starting_balance) * 100 : 0;

  return (
    <div 
      className={`min-h-screen p-6 ${getFontSizeClass(overlaySettings.font_size)}`} 
      style={getOverlayStyle()}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{color: overlaySettings.text_color}}>
            {session.session_name || 'Bonus Hunt'}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div 
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: session.bonus_opening_phase ? '#8b5cf6' : '#22c55e',
                color: '#000000'
              }}
            >
              {session.bonus_opening_phase ? 'Opening Bonuses' : 'Active Session'}
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {/* Starting Balance */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3" style={{color: '#22c55e'}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Starting</span>
            </div>
            <div className="text-sm font-bold" style={{color: '#22c55e'}}>
              ${session.starting_balance.toFixed(2)}
            </div>
          </div>

          {/* Current Balance */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3" style={{color: overlaySettings.accent_color}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Balance</span>
            </div>
            <div className="text-sm font-bold" style={{color: overlaySettings.text_color}}>
              ${session.current_balance.toFixed(2)}
            </div>
          </div>

          {/* Total Bonuses */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Gift className="h-3 w-3" style={{color: '#f59e0b'}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>Total</span>
            </div>
            <div className="text-sm font-bold" style={{color: overlaySettings.text_color}}>
              {totalBonuses}
            </div>
            <div className="text-xs mt-0.5" style={{color: overlaySettings.text_color, opacity: 0.7}}>
              {completedBonuses} opened • {pendingBonuses} pending
            </div>
          </div>

          {/* Profit/Loss */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Target className="h-3 w-3" style={{color: isProfit ? '#22c55e' : '#ef4444'}} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>P&L</span>
            </div>
            <div className="text-sm font-bold" style={{color: isProfit ? '#22c55e' : '#ef4444'}}>
              {isProfit ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Current Avg and Required Avg Highlighted Box */}
        <div className="mb-3">
          <div 
            className="grid grid-cols-2 gap-2 p-2 rounded-md border-2"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderColor: overlaySettings.accent_color
            }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3" style={{color: overlaySettings.accent_color}} />
                <span className="text-xs font-medium opacity-70" style={{color: overlaySettings.text_color}}>Current Avg</span>
              </div>
              <div className="text-sm font-bold" style={{color: overlaySettings.accent_color}}>
                {avgMultiplier.toFixed(2)}x
              </div>
              <div className="text-xs mt-0.5" style={{color: overlaySettings.text_color, opacity: 0.7}}>
                {openedBonuses.length} opened
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Target className="h-3 w-3" style={{color: isProfit ? '#22c55e' : '#f59e0b'}} />
                <span className="text-xs font-medium opacity-70" style={{color: overlaySettings.text_color}}>Required Avg</span>
              </div>
              <div className="text-sm font-bold" style={{color: isProfit ? '#22c55e' : '#f59e0b'}}>
                {isProfit ? `Profit: ${profitPercentage.toFixed(1)}%` : `${requiredAvgMulti.toFixed(2)}x`}
              </div>
              <div className="text-xs mt-0.5" style={{color: overlaySettings.text_color, opacity: 0.7}}>
                {isProfit ? 'Above break even' : 'To break even'}
              </div>
            </div>
          </div>
        </div>

        {/* Currently Opening Bonus */}
        {session?.bonus_opening_phase && bonuses.length > 0 && (
          <div className="mb-3">
            <h2 className="text-xs font-semibold mb-1" style={{color: overlaySettings.text_color}}>
              Currently Opening
            </h2>
            {(() => {
              const nextBonusToOpen = bonuses.find(bonus => !bonus.payout_recorded_at);
              return nextBonusToOpen ? (
                <div 
                  className="p-2 rounded-md border-2 border-dashed"
                  style={{
                    backgroundColor: overlaySettings.show_background ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    borderColor: '#8b5cf6'
                  }}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold mb-0.5" style={{color: '#8b5cf6'}}>
                      {nextBonusToOpen.slot_name}
                    </div>
                    <div className="text-xs" style={{color: overlaySettings.text_color}}>
                      ${nextBonusToOpen.bet_size.toFixed(2)} spin
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3" style={{color: overlaySettings.text_color, opacity: 0.7}}>
                  All bonuses have been opened!
                </div>
              );
            })()}
          </div>
        )}

        {/* Bonuses Grid */}
        <div>
          <h2 className="text-sm font-semibold mb-2" style={{color: overlaySettings.text_color}}>
            Bonus Queue ({bonuses.length})
          </h2>
          
          {bonuses.length === 0 ? (
            <div className="text-center py-12" style={{color: overlaySettings.text_color, opacity: 0.7}}>
              No bonuses in the queue yet
            </div>
          ) : (
            <div 
              className="relative overflow-hidden rounded-xl"
              style={{ 
                height: `${(() => {
                  const visibleBonuses = Math.min(bonuses.length, overlaySettings.max_visible_bonuses || maxBonuses);
                  const itemHeight = 40; // even smaller for better fit
                  const spacing = Math.max(0, visibleBonuses - 1) * 4; // space-y-1 between items
                  const containerPadding = 12; // p-1.5 top and bottom
                  return visibleBonuses * itemHeight + spacing + containerPadding;
                })()}px`,
                backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
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
                {infiniteScrollBonuses.map((bonus, index) => (
                  <div
                    key={`${bonus.id}-${Math.floor(index / bonuses.length)}`}
                    className="flex items-center justify-between p-1.5 rounded-sm border"
                    style={{
                      backgroundColor: bonus.payout_recorded_at 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(249, 115, 22, 0.1)',
                      borderColor: bonus.payout_recorded_at 
                        ? '#22c55e' 
                        : '#f97316',
                      minHeight: '40px'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: overlaySettings.accent_color,
                          color: '#000000'
                        }}
                      >
                        #{(index % bonuses.length) + 1}
                      </div>
                      <div>
                        <div className="font-medium text-xs" style={{color: overlaySettings.text_color}}>
                          {bonus.slot_name}
                        </div>
                        <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>
                          ${bonus.bet_size.toFixed(2)} spin
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {bonus.payout_recorded_at ? (
                        <div>
                          <div className="font-bold text-green-400 text-xs">
                            ${bonus.payout_amount?.toFixed(2)}
                          </div>
                          {bonus.bonus_multiplier && (
                            <div className="text-xs text-yellow-400">
                              {bonus.bonus_multiplier.toFixed(2)}x
                            </div>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: '#f97316',
                            color: '#000000'
                          }}
                        >
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gradient overlays for smooth fade effect */}
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
        </div>
      </div>
    </div>
  );
}