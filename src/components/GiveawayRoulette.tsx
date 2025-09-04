import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, RotateCcw, Play, Trophy, Users, CheckCircle2 } from 'lucide-react';

interface Participant {
  id: number;
  username: string;
  avatar?: string;
}

interface WinnerResult {
  winner: Participant;
  winningTicket: number;
  ticketsPerParticipant: number;
  totalTickets: number;
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
    const totalTickets = 1000;
    const ticketsPerParticipant = Math.floor(totalTickets / participants.length);
    
    // Generate random winning ticket (1-1000)
    const winningTicket = Math.floor(Math.random() * totalTickets) + 1;
    
    // Calculate which participant owns this ticket
    const winnerIndex = Math.floor((winningTicket - 1) / ticketsPerParticipant);
    const actualWinnerIndex = Math.min(winnerIndex, participants.length - 1);
    
    const winner = participants[actualWinnerIndex];
    
    console.log("🎲 ROULETTE SELECTION DEBUG:", {
      participantsReceived: participants.map((p, i) => `${i}: ${p.username}`),
      totalTickets,
      ticketsPerParticipant,
      winningTicket,
      calculatedIndex: winnerIndex,
      actualWinnerIndex,
      selectedWinner: winner.username,
      calculation: `Ticket ${winningTicket} → (${winningTicket}-1)/${ticketsPerParticipant} = ${(winningTicket-1)/ticketsPerParticipant} → Index ${actualWinnerIndex}`
    });
    
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
    
    console.log("🎰 Starting roulette with participants:", participants.map(p => p.username));
    
    // Step 1: Select winner using provably fair system (FINAL - never changes)
    const result = selectWinner();
    setWinnerResult(result);
    setSelectedWinner(result.winner);
    
    // Step 2: Lock the result to prevent any changes
    setIsResultLocked(true);
    
    console.log("🔒 RESULT LOCKED:", {
      finalWinner: result.winner.username,
      winningTicket: result.winningTicket,
      locked: true
    });
    
    // Step 3: Start animation
    setIsSpinning(true);
    setShowResult(false);
    setScrollPosition(0);
    
    // Step 4: Calculate landing position using CURRENT container width (for animation only)
    const calculateAndAnimate = () => {
      const participantWidth = 80;
      
      // Get actual container width for animation calculation
      const actualContainerWidth = containerRef.current?.offsetWidth || 800;
      const centerPosition = actualContainerWidth / 2;
      
      // Find winner's index in original participants array
      const winnerIndex = participants.findIndex(p => p.username === result.winner.username);
      
      if (winnerIndex === -1) {
        console.error("❌ CRITICAL ERROR: Winner not found in participants array!");
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
        const currentCenterPosition = actualContainerWidth / 2;
        setLockedIndicatorPosition(currentCenterPosition);
        
        console.log("✅ FINAL RESULT LOCKED:", {
          winner: result.winner.username,
          scrollPosition: targetPosition,
          lockedIndicatorPosition: currentCenterPosition,
          containerWidth: actualContainerWidth
        });
      }, 4000);
    };
    
    // Execute animation
    calculateAndAnimate();
  };

  // Reset roulette - UNLOCKS everything for new selection
  const resetRoulette = () => {
    console.log("🔓 UNLOCKING ALL POSITIONS for new selection");
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

  // Auto-start roulette when participants change and showStartButton is false
  useEffect(() => {
    if (participants.length > 0 && !showStartButton && !isSpinning && !selectedWinner) {
      console.log("🎰 Auto-starting roulette with", participants.length, "participants");
      const timer = setTimeout(() => {
        startRoulette();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [participants, showStartButton, isSpinning, selectedWinner]);

  return (
    <Card className="gaming-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-kick-green" />
          Giveaway Roulette
          <Crown className="h-5 w-5 text-kick-green" />
        </CardTitle>
        <p className="text-center text-muted-foreground">
          {participants.length} participants {!localStorage.getItem('guest_mode') && '• Provably Fair System'}
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
          <div ref={containerRef} className="relative h-32">
            <div 
              className="flex absolute top-0 h-full"
              style={{ 
                transform: `translateX(-${scrollPosition}px)`,
                width: `${extendedParticipants.length * 80}px`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
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
                  <p className="text-xs mt-1 text-center text-foreground/80 truncate w-full relative z-10">
                    {participant.username}
                  </p>
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
                  <p className="text-xl font-bold text-foreground">{selectedWinner.username}</p>
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
              Pick Winner
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
                    <span className="text-xs text-foreground">{participant.username}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}