import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Crown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from '@/components/VerificationBadge';

interface Participant {
  id: number;
  username: string;
  avatar: string;
  isWinner?: boolean;
  isVerified?: boolean;
}

interface HorizontalRouletteProps {
  participants: Participant[];
  isSpinning: boolean;
  winner?: Participant; // Winner determined externally by provably fair system
  isWinnerPending?: boolean;
  onAcceptWinner?: () => void;
  onRerollWinner?: () => void;
}

export function HorizontalRoulette({ 
  participants, 
  isSpinning, 
  winner, 
  isWinnerPending, 
  onAcceptWinner, 
  onRerollWinner 
}: HorizontalRouletteProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset animation states when isSpinning changes or winner changes
  useEffect(() => {
    if (!isSpinning && !winner) {
      console.log("🔄 ROULETTE: Resetting animation states");
      setScrollPosition(0);
      setShowWinner(false);
      setIsAnimating(false);
    }
  }, [isSpinning, winner]);

  // Create simple extended participants array - just repeat participants in order
  const extendedParticipants = useMemo(() => {
    if (participants.length === 0) return [];
    
    // Repeat participants 100 times for smooth scrolling
    const repetitions = 100;
    const extended = [];
    
    for (let i = 0; i < repetitions; i++) {
      participants.forEach((participant, index) => {
        extended.push({
          ...participant,
          uniqueKey: `cycle-${i}-participant-${index}`
        });
      });
    }
    
    return extended;
  }, [participants]);

  useEffect(() => {
    if (isSpinning && participants.length > 0 && winner && !isAnimating) {
      console.log("🎰 ROULETTE: Starting animation to land on winner:", winner.username);
      console.log("🔍 ROULETTE: Participants array received:", participants.map((p, i) => `${i}: ${p.username}`));
      setIsAnimating(true);
      setShowWinner(false);
      
      // Reset scroll position to 0 first
      setScrollPosition(0);
      
      // Calculate EXACT landing position for the provided winner
      const participantWidth = 80;
      const containerWidth = 800;
      const centerLinePosition = containerWidth / 2;
      
      // Find winner's index in the original participants array
      const winnerIndexInOriginal = participants.findIndex(p => p.username === winner.username);
      
      if (winnerIndexInOriginal === -1) {
        console.error("❌ ROULETTE: Winner not found in participants:", winner.username);
        console.log("🔍 Available participants:", participants.map(p => p.username));
        setIsAnimating(false);
        return;
      }
      
      console.log("🎯 ROULETTE: Found winner at index:", winnerIndexInOriginal, "for user:", winner.username);
      
      // Calculate target position after 25 cycles for dramatic effect
      const cycles = 25;
      const participantsInOneCycle = participants.length;
      const targetIndex = (cycles * participantsInOneCycle) + winnerIndexInOriginal;
      
      // Calculate exact scroll position to center this winner's avatar
      const avatarLeftEdge = targetIndex * participantWidth;
      const avatarCenter = avatarLeftEdge + (participantWidth / 2);
      const finalScrollPosition = avatarCenter - centerLinePosition;
      
      console.log("🎯 ROULETTE: Animation calculation:", {
        winnerUsername: winner.username,
        winnerIndexInOriginal,
        cycles,
        participantsInOneCycle,
        targetIndex,
        avatarLeftEdge,
        avatarCenter,
        centerLinePosition,
        finalScrollPosition,
        participantAtTargetIndex: extendedParticipants[targetIndex]?.username
      });
      
      // Start animation to land on this exact winner
      setTimeout(() => {
        console.log("🚀 Starting scroll to position:", finalScrollPosition);
        setScrollPosition(finalScrollPosition);
      }, 100);
      
      // Complete animation and show winner
      setTimeout(() => {
        console.log("✅ Animation complete, landed on winner:", winner.username);
        setIsAnimating(false);
        setShowWinner(true);
      }, 4000); // 4 second animation
    }
  }, [isSpinning, participants, winner, isAnimating]);

  return (
    <Card className="gaming-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-kick-green" />
          Giveaway Roulette
          <Crown className="h-5 w-5 text-kick-green" />
        </CardTitle>
        <p className="text-center text-muted-foreground">
          {participants.length} participants ready to win!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Horizontal Roulette Strip */}
        <div className="relative overflow-hidden border-2 border-kick-green/30 rounded-lg bg-gradient-to-r from-kick-dark via-kick-purple/20 to-kick-dark">
          {/* Winner Indicator */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-20">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-kick-green drop-shadow-lg" />
          </div>
          
          {/* Winner Line */}
          <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-kick-green z-10 opacity-50" />
          
          {/* Scrolling Container */}
          <div className="relative h-24 sm:h-32">
            <div 
              className="flex absolute top-0 h-full"
              style={{ 
                transform: `translateX(-${scrollPosition}px)`,
                width: `${extendedParticipants.length * 80}px`,
                transition: isAnimating ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
              }}
            >
              {extendedParticipants.map((participant) => (
                <div
                  key={participant.uniqueKey}
                  className="flex-shrink-0 w-20 h-full flex flex-col items-center justify-center p-2 border-r border-kick-green/20"
                >
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-background shadow-lg">
                    <AvatarImage 
                      src={participant.avatar}
                      alt={participant.username}
                      onError={(e) => {
                        // Fallback to default if Kick avatar fails
                        e.currentTarget.src = '/placeholder-avatar.jpg';
                      }}
                    />
                    <AvatarFallback className="bg-kick-green text-kick-dark text-xs font-bold">
                      {participant.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs mt-1 text-center text-foreground/80 truncate w-full">
                    {participant.username}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Gradient Overlays for smooth edges */}
          <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-kick-dark to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-kick-dark to-transparent pointer-events-none z-10" />
        </div>

        {/* Winner Display */}
        {winner && showWinner && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 sm:p-6 rounded-xl bg-kick-green/10 border border-kick-green/30">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-kick-green animate-pulse" />
                <h4 className="text-lg sm:text-xl font-bold text-foreground">🎉 Winner Selected! 🎉</h4>
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-kick-green animate-pulse" />
              </div>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-kick-green pulse-glow">
                  <AvatarImage 
                    src={winner.avatar}
                    alt={winner.username}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-avatar.jpg';
                    }}
                  />
                  <AvatarFallback className="bg-kick-green text-kick-dark font-bold text-lg">
                    {winner.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{winner.username}</p>
                  <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30 mt-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Winner
                  </Badge>
                </div>
              </div>

              {/* Accept/Reroll Buttons */}
              {isWinnerPending && onAcceptWinner && onRerollWinner && (
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={onAcceptWinner}
                    className="bg-kick-green hover:bg-kick-green/80 text-kick-dark font-bold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept Winner
                  </Button>
                  <Button 
                    onClick={onRerollWinner}
                    variant="outline"
                    className="border-kick-green/30 text-kick-green hover:bg-kick-green/10"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Reroll
                  </Button>
                </div>
              )}
            </div>
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
                    {participant.isVerified && (
                      <VerificationBadge 
                        isVerified={true} 
                        size="sm" 
                        showText={false}
                        className="ml-1"
                      />
                    )}
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