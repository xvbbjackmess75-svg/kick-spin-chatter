import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Zap, Crown } from "lucide-react";

interface Participant {
  id: number;
  username: string;
  avatar: string;
  isWinner?: boolean;
}

interface HorizontalRouletteProps {
  participants: Participant[];
  isSpinning: boolean;
  onSpin: () => void;
  winner?: Participant;
}

export function HorizontalRoulette({ participants, isSpinning, onSpin, winner }: HorizontalRouletteProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isSpinning && participants.length > 0) {
      setAnimationClass("roulette-scroll");
      
      // Calculate scroll to ensure we always land on a participant
      const participantWidth = 80; // Width of each participant slot
      const containerWidth = 800; // Visible container width
      const visibleParticipants = Math.floor(containerWidth / participantWidth);
      
      // Create enough scrolling distance (20-50 full cycles) plus landing position
      const fullCycles = 20 + Math.random() * 30; // 20-50 cycles
      const cycleDistance = participants.length * participantWidth;
      const baseCycles = Math.floor(fullCycles) * cycleDistance;
      
      // Random landing position within one cycle
      const randomLanding = Math.floor(Math.random() * participants.length) * participantWidth;
      
      // Center the selection in the viewport
      const centerOffset = containerWidth / 2 - participantWidth / 2;
      
      const finalScrollPosition = baseCycles + randomLanding - centerOffset;
      setScrollPosition(finalScrollPosition);
      
      // Reset animation after spinning
      setTimeout(() => {
        setAnimationClass("");
      }, 8000);
    }
  }, [isSpinning, participants.length]);

  // Create extended participants array for seamless infinite scrolling
  // Repeat participants enough times to fill scroll distance + visible area
  const repeats = Math.max(8, Math.ceil(2400 / (participants.length * 80))); // Ensure enough length
  const extendedParticipants = Array(repeats).fill(participants).flat();

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
              className={`flex absolute top-0 h-full transition-transform duration-[8000ms] ease-out ${isSpinning ? '' : ''}`}
              style={{ 
                transform: `translateX(-${scrollPosition}px)`,
                width: `${extendedParticipants.length * 80}px`,
                ...(isSpinning && {
                  transition: 'transform 8s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                })
              }}
            >
              {extendedParticipants.map((participant, index) => (
                <div
                  key={`${participant.id}-${index}`}
                  className="flex-shrink-0 w-20 h-full flex flex-col items-center justify-center p-2 border-r border-kick-green/20"
                >
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-background shadow-lg">
                    <AvatarImage 
                      src={`https://files.kick.com/images/user/${participant.username}/profile_image/conversion/300x300-medium.webp`}
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
        {winner && !isSpinning && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 sm:p-6 rounded-xl bg-kick-green/10 border border-kick-green/30">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-kick-green animate-pulse" />
                <h4 className="text-lg sm:text-xl font-bold text-foreground">🎉 Winner Selected! 🎉</h4>
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-kick-green animate-pulse" />
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-kick-green pulse-glow">
                  <AvatarImage 
                    src={`https://files.kick.com/images/user/${winner.username}/profile_image/conversion/300x300-medium.webp`}
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
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{participants.length} participants</span>
            </div>
          </div>
        </div>

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
                        src={`https://files.kick.com/images/user/${participant.username}/profile_image/conversion/300x300-medium.webp`}
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