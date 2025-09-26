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
  customSettings?: OverlaySettings;
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

export default function SlotsOverlay({ userId, maxCalls = 10, customSettings }: SlotsOverlayProps) {
  const [calls, setCalls] = useState<SlotsCall[]>([]);
  const [event, setEvent] = useState<SlotsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    background_color: 'rgba(0, 0, 0, 0.95)',
    border_color: 'hsl(var(--primary))',
    text_color: 'hsl(var(--foreground))',
    accent_color: 'hsl(var(--primary))',
    font_size: 'medium',
    max_visible_calls: 10,
    scrolling_speed: 50,
    show_background: true,
    show_borders: true,
    animation_enabled: true
  });
  
  // Force component remount when cache-buster changes by including it in key
  const urlParams = new URLSearchParams(window.location.search);
  const cacheBuster = urlParams.get('cb') || 'default';

  // Effect to handle custom settings and initial setup
  useEffect(() => {
    console.log('🚀 SlotsOverlay mounted with props:', { userId, maxCalls, customSettings });
    if (userId) {
      console.log(`🔄 Setting up overlay for userId: ${userId}`);
      
      // Load settings and data
      const loadData = async () => {
        console.log('📝 Loading overlay settings first...');
        await fetchOverlaySettings();
        console.log('📊 Loading event data...');
        await fetchActiveEventAndCalls();
      };
      
      loadData();
      
      // Set up real-time subscription for events and calls with better refresh logic
      const eventsSubscription = supabase
        .channel(`slots_events_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slots_events',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔔 Event change detected:', payload);
            // Always refresh when events change for this user
            setTimeout(() => fetchActiveEventAndCalls(), 100);
          }
        )
        .subscribe();

      const callsSubscription = supabase
        .channel(`slots_calls_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slots_calls'
          },
          (payload: any) => {
            console.log('🔔 Call change detected:', payload);
            // Refresh on any call change since we filter by user in the function
            setTimeout(() => fetchActiveEventAndCalls(), 100);
          }
        )
        .subscribe();

      // Also set up a periodic refresh every 5 seconds to ensure OBS stays synced
      const intervalId = setInterval(() => {
        console.log('🔄 Periodic overlay refresh');
        fetchActiveEventAndCalls();
      }, 5000);

      return () => {
        console.log('🧹 Cleaning up overlay subscriptions');
        supabase.removeChannel(eventsSubscription);
        supabase.removeChannel(callsSubscription);
        clearInterval(intervalId);
      };
    } else {
      console.log('⚠️ No userId provided for overlay');
    }
  }, [userId]);

  // Update settings when customSettings change
  useEffect(() => {
    console.log('🎨 Custom settings effect triggered:', { customSettings });
    if (customSettings) {
      console.log('🎨 Updating overlay with custom settings:', customSettings);
      setOverlaySettings(customSettings);
    }
  }, [customSettings]);

  // Handle scrolling animation
  useEffect(() => {
    console.log('🎬 Scroll effect triggered with settings:', {
      callsLength: calls.length,
      maxVisibleCalls: overlaySettings.max_visible_calls,
      animationEnabled: overlaySettings.animation_enabled,
      scrollingSpeed: overlaySettings.scrolling_speed,
      shouldScroll: calls.length > overlaySettings.max_visible_calls && overlaySettings.animation_enabled,
      eventStatus: event?.status
    });

    if (calls.length > overlaySettings.max_visible_calls && overlaySettings.animation_enabled) {
      console.log('🎬 Starting scroll animation - calls exceed visible limit');
      const interval = setInterval(() => {
        setScrollPosition(prev => {
          // Calculate actual item height including spacing (40px + 4px spacing)
          const itemHeight = 44;
          const maxScroll = calls.length * itemHeight;
          
          // Convert speed setting to actual pixels per interval (1-100 scale to 0.5-5 pixels)
          const scrollSpeed = Math.max(0.5, (overlaySettings.scrolling_speed || 50) / 20);
          const newPosition = prev + scrollSpeed;
          
          // Reset to 0 when we've scrolled past all original items to create infinite loop
          return newPosition >= maxScroll ? 0 : newPosition;
        });
      }, 50); // Fixed 50ms intervals for smooth animation

      return () => {
        console.log('🎬 Stopping scroll animation');
        clearInterval(interval);
      };
    } else {
      console.log('🎬 No scroll needed - not enough calls or animation disabled');
      setScrollPosition(0);
    }
  }, [calls.length, overlaySettings.max_visible_calls, maxCalls, overlaySettings.animation_enabled, overlaySettings.scrolling_speed, event?.status]);

  const fetchOverlaySettings = async () => {
    if (!userId) {
      console.log('⚠️ No userId provided for overlay settings');
      return;
    }

    try {
      console.log(`🎨 Fetching overlay settings for userId: ${userId}`);
      
      const { data, error } = await supabase
        .from('overlay_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching overlay settings:", error);
        return;
      }

      if (data) {
        console.log('✅ Found overlay settings from database:', data);
        console.log('🎨 Applying custom overlay settings:', {
          background_color: data.background_color,
          text_color: data.text_color,
          accent_color: data.accent_color,
          border_color: data.border_color,
          scrolling_speed: data.scrolling_speed,
          max_visible_calls: data.max_visible_calls,
          animation_enabled: data.animation_enabled
        });
        // Apply the settings immediately
        setOverlaySettings(prevSettings => {
          const newSettings = { ...prevSettings, ...data };
          console.log('🔄 Settings state updated:', newSettings);
          return newSettings;
        });
      } else {
        console.log('ℹ️ No custom overlay settings found, using defaults');
      }
    } catch (error) {
      console.error("❌ Exception fetching overlay settings:", error);
    }
  };

  const fetchActiveEventAndCalls = async () => {
    if (!userId) return;

    try {
      const timestamp = new Date().toISOString();
      console.log(`🔍 [${timestamp}] Fetching secure overlay data for userId: ${userId}`);
      
      // Use secure function that only returns essential overlay data
      const { data: eventData, error: eventError } = await supabase
        .rpc('get_secure_overlay_event', { target_user_id: userId });

      console.log(`📊 [${timestamp}] Secure event query result:`, { eventData, eventError });

      if (eventError) {
        console.error("Error fetching secure overlay event:", eventError);
        setEvent(null);
        setCalls([]);
        setLoading(false);
        return;
      }

      if (!eventData || eventData.length === 0) {
        console.log(`ℹ️ [${timestamp}] No active events found for user`);
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

      console.log(`🔍 [${timestamp}] Raw calls data from function:`, callsData);

      if (callsError) {
        console.error("Error fetching calls:", callsError);
        setCalls([]);
      } else {
        // Filter calls for the current event since the function returns all active calls
        const eventCalls = callsData?.filter((call: any) => call.event_id === secureEvent.event_id) || [];
        console.log(`📊 [${timestamp}] Filtered event calls:`, eventCalls.length, 'calls for event', secureEvent.event_id);
        
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
        console.log(`🎯 [${timestamp}] Mapped calls for overlay:`, mappedCalls.length, 'calls');
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
  
  // Calculate financial stats
  const totalCost = calls.reduce((sum, call) => sum + (call.bet_amount || 0), 0);
  const totalReturns = calls.filter(call => call.status === 'completed').reduce((sum, call) => sum + (call.win_amount || 0), 0);
  const totalProfit = totalReturns - totalCost;
  const currentROI = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;
  
  // Calculate required multiplier to break even
  const completedWins = calls.filter(call => call.status === 'completed' && (call.win_amount || 0) > 0);
  const pendingCost = calls.filter(call => call.status === 'pending').reduce((sum, call) => sum + (call.bet_amount || 0), 0);
  const remainingLoss = Math.max(0, totalCost - totalReturns);
  const avgBetSize = pendingCost / Math.max(1, pendingCalls);
  const requiredMultiplier = pendingCalls > 0 && avgBetSize > 0 ? (remainingLoss / avgBetSize) + 1 : 0;

  // Create duplicated calls for infinite scroll effect when needed
  const shouldEnableInfiniteScroll = calls.length > (overlaySettings.max_visible_calls || maxCalls) && overlaySettings.animation_enabled;
  console.log('🎬 Infinite scroll check:', { 
    shouldEnableInfiniteScroll, 
    callsLength: calls.length, 
    maxVisible: overlaySettings.max_visible_calls, 
    animationEnabled: overlaySettings.animation_enabled,
    eventStatus: event?.status
  });
  const infiniteScrollCalls = shouldEnableInfiniteScroll 
    ? [...calls, ...calls, ...calls] // Triple the calls array for seamless infinite loop
    : calls;

  return (
    <div 
      className={`min-h-screen p-6 ${getFontSizeClass(overlaySettings.font_size)}`} 
      style={getOverlayStyle()}
      data-user-id={userId} // Add data attribute for debugging
      data-settings-loaded={JSON.stringify(overlaySettings !== null)} // Debug info
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
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

          {/* Cost/Returns */}
          <div 
            className="p-2 rounded-md border"
            style={{
              backgroundColor: overlaySettings.show_background ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent'
            }}
          >
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className={`h-3 w-3 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>P&L</span>
            </div>
            <div className={`text-xs font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalCost.toFixed(0)}→${totalReturns.toFixed(0)}
            </div>
            <div className={`text-xs ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentROI > 0 ? '+' : ''}{currentROI.toFixed(0)}%
              {pendingCalls > 0 && requiredMultiplier > 0 && (
                <div className="text-xs opacity-70" style={{color: overlaySettings.text_color}}>
                  Need {requiredMultiplier.toFixed(1)}x
                </div>
              )}
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
                className="space-y-1 p-1.5"
                style={{
                  transform: `translateY(-${scrollPosition}px)`,
                  transition: scrollPosition === 0 ? 'transform 0.3s ease-out' : 'none', // Smooth reset to top
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
                          {call.status === 'completed' ? (
                            (() => {
                              const cost = call.bet_amount || 0;
                              const returns = call.win_amount || 0;
                              const profit = returns - cost;
                              const isProfit = profit > 0;
                              const percentage = cost > 0 ? ((profit / cost) * 100) : 0;
                              
                              return (
                                <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${isProfit ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                  ${cost.toFixed(0)}→${returns.toFixed(0)} ({percentage > 0 ? '+' : ''}{percentage.toFixed(0)}%)
                                </div>
                              );
                            })()
                          ) : (
                            <div 
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                call.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}
                            >
                              {call.status === 'pending' ? 'Pending' : call.status}
                            </div>
                          )}
                          
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