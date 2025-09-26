import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, RotateCcw, Play, Trophy, Users, CheckCircle2, User, Gift, CheckCircle, AlertCircle, UserMinus, Shield } from 'lucide-react';
import { VerificationBadge } from '@/components/VerificationBadge';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: number;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

interface WinnerResult {
  winner: Participant;
  winningTicket: number;
  ticketsPerParticipant: number;
  totalTickets: number;
}

interface UserProfile {
  username: string;
  isVerified: boolean;
  totalGiveawayEntries: number;
  recentParticipations: Array<{
    giveawayId: string;
    giveawayTitle: string;
    channelName: string;
    joinedAt: Date;
  }>;
}

interface UserSecurityInfo {
  isAltAccount: boolean;
  isVpnProxyTorUser: boolean;
}

interface GiveawayRouletteProps {
  participants: Participant[];
  onPendingWinner: (winner: Participant, result: WinnerResult) => void;
  onRerollWinner: () => void;
  onStartNewRoll: () => void;
  currentPendingWinner: Participant | null;
  showStartButton: boolean;
}

export function GiveawayRoulette({ 
  participants, 
  onPendingWinner, 
  onRerollWinner, 
  onStartNewRoll,
  currentPendingWinner,
  showStartButton
}: GiveawayRouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState<Participant | null>(null);
  const [winnerResult, setWinnerResult] = useState<WinnerResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isResultLocked, setIsResultLocked] = useState(false);
  const [lockedIndicatorPosition, setLockedIndicatorPosition] = useState<number | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [userSecurityCache, setUserSecurityCache] = useState<Record<string, UserSecurityInfo>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Create extended participants array for seamless scrolling
  const extendedParticipants = [];
  const repetitions = 50;
  
  for (let i = 0; i < repetitions; i++) {
    participants.forEach((participant, index) => {
      extendedParticipants.push({
        ...participant,
        uniqueKey: `cycle-${i}-participant-${index}`,
        originalIndex: index
      });
    });
  }

  // Provably fair winner selection
  const selectWinner = (): WinnerResult => {
    const totalTickets = 100000;
    const ticketsPerParticipant = Math.floor(totalTickets / participants.length);
    
    // Generate random winning ticket (1-100000)
    const winningTicket = Math.floor(Math.random() * totalTickets) + 1;
    
    // Calculate which participant owns this ticket
    const winnerIndex = Math.floor((winningTicket - 1) / ticketsPerParticipant);
    const actualWinnerIndex = Math.min(winnerIndex, participants.length - 1);
    
    const winner = participants[actualWinnerIndex];
    
    return {
      winner,
      winningTicket,
      ticketsPerParticipant,
      totalTickets
    };
  };

  // Start the roulette process
  const startRoulette = () => {
    if (participants.length === 0 || isResultLocked) return;
    
    if (participants.length === 0 || isResultLocked) return;
    
    // Step 1: Select winner using provably fair system (FINAL - never changes)
    const result = selectWinner();
    setWinnerResult(result);
    setSelectedWinner(result.winner);
    
    // Step 2: Lock the result to prevent any changes
    setIsResultLocked(true);
    
    // Step 3: Start animation
    setIsSpinning(true);
    setShowResult(false);
    setScrollPosition(0);
    
    // Step 4: Add escape key listener for skipping (keep ESC functionality)
    const handleSkip = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSpinning) {
        console.log("⏭️ Animation skipped with ESC key");
        skipToFinalResult();
      }
    };

    const skipToFinalResult = () => {
      setIsSpinning(false);
      setShowResult(true);
      
      // Calculate final position immediately
      const participantWidth = 80;
      const actualContainerWidth = containerRef.current?.offsetWidth || 800;
      const centerPosition = actualContainerWidth / 2;
      const winnerIndex = participants.findIndex(p => p.username === result.winner.username);
      const cycles = 25;
      const targetIndex = (cycles * participants.length) + winnerIndex;
      const targetPosition = (targetIndex * participantWidth) + (participantWidth / 2) - centerPosition;
      
      setScrollPosition(targetPosition);
      setLockedIndicatorPosition(centerPosition);
    };

    document.addEventListener('keydown', handleSkip);
    
    // Step 5: Calculate landing position using CURRENT container width (for animation only)
    const calculateAndAnimate = () => {
      const participantWidth = 80;
      
      // Get actual container width for animation calculation
      const actualContainerWidth = containerRef.current?.offsetWidth || 800;
      const centerPosition = actualContainerWidth / 2;
      
      // Find winner's index in original participants array
      const winnerIndex = participants.findIndex(p => p.username === result.winner.username);
      
      if (winnerIndex === -1) {
        console.error("❌ CRITICAL ERROR: Winner not found in participants array!");
        document.removeEventListener('keydown', handleSkip);
        return;
      }
      
      // Calculate target position (after several cycles)
      const cycles = 25;
      const targetIndex = (cycles * participants.length) + winnerIndex;
      const targetPosition = (targetIndex * participantWidth) + (participantWidth / 2) - centerPosition;
      
      console.log("🎯 ANIMATION (locked result):", {
        lockedWinner: result.winner.username,
        winnerIndex,
        actualContainerWidth,
        targetPosition
      });
      
      // Animate to winner
      setTimeout(() => {
        setScrollPosition(targetPosition);
      }, 100);
      
      // Show final result and LOCK positions
      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        
        // LOCK the indicator position at the current center
        setLockedIndicatorPosition(centerPosition);
        
        document.removeEventListener('keydown', handleSkip);
      }, 4000);
    };
    
    // Execute animation
    calculateAndAnimate();
  };

  // Reset roulette - UNLOCKS everything for new selection
  const resetRoulette = () => {
    setIsSpinning(false);
    setScrollPosition(0);
    setSelectedWinner(null);
    setWinnerResult(null);
    setShowResult(false);
    setIsResultLocked(false);
    setLockedIndicatorPosition(null);
  };

  // Handle accept pending winner
  const handleAcceptPendingWinner = () => {
    if (selectedWinner && winnerResult) {
      onPendingWinner(selectedWinner, winnerResult);
      // Don't reset here - parent will manage state
    }
  };

  // Handle reroll
  const handleReroll = () => {
    resetRoulette();
    onRerollWinner();
    
    // Start new selection after short delay
    setTimeout(() => {
      if (participants.length > 0) {
        startRoulette();
      }
    }, 500);
  };

  // User Security Functions
  const getUserSecurityInfo = async (username: string): Promise<UserSecurityInfo> => {
    // Check cache first
    if (userSecurityCache[username]) {
      return userSecurityCache[username];
    }

    const securityInfo: UserSecurityInfo = { isAltAccount: false, isVpnProxyTorUser: false };

    try {
      // Check alt account status using the database function
      const { data: altData, error: altError } = await supabase
        .rpc('check_alt_account_by_username', { target_username: username });

      if (altError) {
        console.error('Error checking alt account:', altError);
      } else {
        securityInfo.isAltAccount = Boolean(altData);
      }

      // Check VPN/Proxy/Tor status using the database function
      const { data: vpnData, error: vpnError } = await supabase
        .rpc('check_vpn_proxy_tor_by_username', { target_username: username });

      if (vpnError) {
        console.error('Error checking VPN/Proxy/Tor:', vpnError);
      } else {
        securityInfo.isVpnProxyTorUser = Boolean(vpnData);
      }
    } catch (error) {
      console.error('Error checking user security info:', error);
    }

    // Cache the result
    setUserSecurityCache(prev => ({
      ...prev,
      [username]: securityInfo
    }));

    return securityInfo;
  };

  // UserSecurityBadges component
  const UserSecurityBadges = ({ username }: { username: string }) => {
    const [securityInfo, setSecurityInfo] = useState<UserSecurityInfo>({ isAltAccount: false, isVpnProxyTorUser: false });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!username) return;
      
      const loadSecurityInfo = async () => {
        setLoading(true);
        const info = await getUserSecurityInfo(username);
        setSecurityInfo(info);
        setLoading(false);
      };

      loadSecurityInfo();
    }, [username]);

    if (!username || loading) return null;

    return (
      <>
        {securityInfo.isAltAccount && (
          <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
            <UserMinus className="h-3 w-3 mr-1" />
            Alt Account
          </Badge>
        )}
        {securityInfo.isVpnProxyTorUser && (
          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10">
            <Shield className="h-3 w-3 mr-1" />
            VPN/Proxy/Tor
          </Badge>
        )}
      </>
    );
  };

  // Function to handle user profile click
  const handleUserProfileClick = async (username: string) => {
    try {
      // Get basic verification status
      const participant = participants.find(p => p.username === username);
      const isVerified = participant?.isVerified || false;

      // Get total giveaway entries
      const { count } = await supabase
        .from('giveaway_participants')
        .select('*', { count: 'exact', head: true })
        .eq('kick_username', username);

      // Get recent participations
      const { data: recentData } = await supabase
        .from('giveaway_participants')
        .select(`
          giveaway_id,
          entered_at,
          giveaways!inner(title, id)
        `)
        .eq('kick_username', username)
        .order('entered_at', { ascending: false })
        .limit(5);

      const recentParticipations = recentData?.map(entry => ({
        giveawayId: entry.giveaway_id,
        giveawayTitle: (entry.giveaways as any)?.title || 'Unknown Giveaway',
        channelName: 'Channel', // You might want to get this from giveaways table
        joinedAt: new Date(entry.entered_at)
      })) || [];

      const userProfile: UserProfile = {
        username,
        isVerified,
        totalGiveawayEntries: count || 0,
        recentParticipations
      };

      setSelectedUserProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Reset component state when showStartButton becomes true
  useEffect(() => {
    if (showStartButton) {
      resetRoulette();
    }
  }, [showStartButton]);

  // Auto-start roulette when explicitly requested (showStartButton is false and no current state)
  useEffect(() => {
    // Only auto-start if showStartButton is false AND we don't have a current winner
    if (participants.length > 0 && !showStartButton && !isSpinning && !selectedWinner && !isResultLocked) {
      const timer = setTimeout(() => {
        startRoulette();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [participants, showStartButton, isSpinning, selectedWinner, isResultLocked]);

  return (
    <Card className="gaming-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-kick-green" />
          Giveaway Roulette
          <Crown className="h-5 w-5 text-kick-green" />
        </CardTitle>
        <p className="text-center text-muted-foreground">
          {participants.length} participants • Provably Fair System
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Roulette Strip */}
        <div className="relative overflow-hidden border-2 border-kick-green/30 rounded-lg bg-gradient-to-r from-kick-dark via-kick-purple/20 to-kick-dark">
          
          {/* Winner indicator arrow */}
          <div 
            className="absolute top-0 transform -translate-x-1/2 -translate-y-1 z-20"
            style={{
              left: lockedIndicatorPosition !== null 
                ? `${lockedIndicatorPosition}px` 
                : '50%'
            }}
          >
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-kick-green drop-shadow-lg" />
          </div>
          
          {/* Center line */}
          <div 
            className="absolute top-0 bottom-0 transform -translate-x-1/2 w-1 bg-kick-green z-10 opacity-80"
            style={{
              left: lockedIndicatorPosition !== null 
                ? `${lockedIndicatorPosition}px` 
                : '50%'
            }}
          />
          
          {/* Scrolling container */}
          <div 
            ref={containerRef} 
            className="relative h-32 overflow-hidden"
            style={{ touchAction: 'none' }} // Prevent touch scrolling interference
            onWheel={(e) => {
              if (isSpinning || isResultLocked) {
                e.preventDefault(); // Block scroll during animation
                console.log("🚫 Scroll blocked during locked animation");
              }
            }}
          >
            <div 
              className="flex absolute top-0 h-full pointer-events-none"
              style={{ 
                transform: `translateX(-${scrollPosition}px)`,
                width: `${extendedParticipants.length * 80}px`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
                userSelect: 'none'
              }}
            >
              {extendedParticipants.map((participant) => (
                <div
                  key={participant.uniqueKey}
                  className="flex-shrink-0 w-20 h-full flex flex-col items-center justify-center p-2 border-r border-kick-green/20 relative"
                >
                  <Avatar className="w-16 h-16 border-2 border-background shadow-lg relative z-10">
                    <AvatarImage 
                      src={participant.avatar}
                      alt={participant.username}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-avatar.jpg';
                      }}
                    />
                    <AvatarFallback className="bg-kick-green text-kick-dark text-xs font-bold">
                      {participant.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center gap-0.5 w-full relative z-10">
                    {participant.isVerified && (
                      <VerificationBadge 
                        isVerified={true} 
                        size="sm" 
                        showText={false}
                        className="scale-75"
                      />
                    )}
                    <p className="text-xs text-center text-foreground/80 truncate w-full">
                      {participant.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Gradient overlays */}
          <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-kick-dark to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-kick-dark to-transparent pointer-events-none z-10" />
        </div>


        {/* Winner Actions */}
        {showResult && selectedWinner && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="p-6 bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg border border-accent/30">
              <h3 className="text-2xl font-bold text-foreground mb-2">🎉 Winner Selected!</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Avatar className="w-16 h-16 border-4 border-accent">
                  <AvatarImage 
                    src={selectedWinner.avatar}
                    alt={selectedWinner.username}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-avatar.jpg';
                    }}
                  />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xl font-bold">
                    {selectedWinner.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <button 
                    onClick={() => handleUserProfileClick(selectedWinner.username)}
                    className="text-xl font-bold text-foreground hover:text-primary cursor-pointer transition-colors"
                  >
                    {selectedWinner.username}
                  </button>
                  {winnerResult && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Winning Ticket: #{winnerResult.winningTicket}</p>
                      <p>Total Tickets: {winnerResult.totalTickets}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleAcceptPendingWinner}
                  className="gaming-button"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Add to Winners
                </Button>
                
                <Button 
                  onClick={handleReroll}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reroll
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Start Button for New Rolls */}
        {showStartButton && participants.length > 0 && !isSpinning && !selectedWinner && (
          <div className="text-center py-8">
            <Button 
              onClick={onStartNewRoll}
              className="gaming-button text-lg px-8 py-4"
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              {participants.length === 1 ? 'Pick Winner' : 'Pick Winner'}
            </Button>
          </div>
        )}

        {/* Participants List */}
        {participants.length > 0 && (
          <Card className="gaming-card">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Participants ({participants.length})
              </h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {participants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center gap-2 bg-kick-green/10 border border-kick-green/20 rounded-lg px-2 py-1"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage 
                        src={participant.avatar}
                        alt={participant.username}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-avatar.jpg';
                        }}
                      />
                      <AvatarFallback className="bg-kick-green text-kick-dark text-xs">
                        {participant.username.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={() => handleUserProfileClick(participant.username)}
                      className="text-xs text-foreground hover:text-primary cursor-pointer transition-colors"
                    >
                      {participant.isVerified && '🛡️ '}{participant.username}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <UserSecurityBadges username={selectedUserProfile.username} />
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
      </CardContent>
    </Card>
  );
}