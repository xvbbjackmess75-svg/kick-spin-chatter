import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Zap, Crown } from "lucide-react";
import { VerificationBadge } from '@/components/VerificationBadge';

interface Participant {
  id: number;
  username: string;
  avatar: string;
  isWinner?: boolean;
  isVerified?: boolean;
}

interface RouletteWheelProps {
  participants: Participant[];
  isSpinning: boolean;
  onSpin: () => void;
  winner?: Participant;
}

export function RouletteWheel({ participants, isSpinning, onSpin, winner }: RouletteWheelProps) {
  const [currentRotation, setCurrentRotation] = useState(0);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isSpinning) {
      setAnimationClass("roulette-spin");
      const randomRotation = Math.floor(Math.random() * 360) + 1800; // 5+ full rotations
      setCurrentRotation(randomRotation);
      
      // Reset animation after spinning
      setTimeout(() => {
        setAnimationClass("");
      }, 4000);
    }
  }, [isSpinning]);

  const totalParticipants = participants.length;
  const segmentAngle = totalParticipants > 0 ? 360 / totalParticipants : 0;

  return (
    <Card className="gaming-card w-full">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="text-center space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-kick-green" />
              Giveaway Roulette
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {totalParticipants} participants ready to win!
            </p>
          </div>

          {/* Roulette Wheel Container */}
          <div className="relative flex justify-center">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 sm:-translate-y-2 z-10">
              <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 sm:border-l-4 sm:border-r-4 sm:border-b-8 border-transparent border-b-kick-green drop-shadow-lg" />
            </div>

            {/* Wheel - Responsive sizes */}
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 mx-auto">
              <div 
                className={`w-full h-full rounded-full border-2 sm:border-4 border-kick-green/30 overflow-hidden relative ${animationClass}`}
                style={{ 
                  transform: `rotate(${currentRotation}deg)`,
                  background: 'conic-gradient(from 0deg, hsl(var(--kick-green)), hsl(var(--kick-dark)), hsl(var(--kick-purple)), hsl(var(--kick-green)))'
                }}
              >
                {/* Participant Avatars */}
                {participants.slice(0, 12).map((participant, index) => {
                  const angle = (index * segmentAngle) - 90; // Start from top
                  // Fixed responsive radius based on breakpoints
                  const radius = 75; // Base radius that works across all sizes
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <div
                      key={participant.id}
                      className="absolute w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 transform -translate-x-1/2 -translate-y-1/2 floating-element"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <Avatar className="w-full h-full border-2 border-background shadow-lg">
                        <AvatarImage 
                          src={participant.avatar} 
                          onLoad={() => console.log('✅ RouletteWheel avatar loaded:', participant.avatar)}
                          onError={(e) => console.error('❌ RouletteWheel avatar failed:', participant.avatar, e)}
                        />
                        <AvatarFallback className="bg-kick-green text-kick-dark text-xs font-bold">
                          {participant.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  );
                })}

                {/* Center Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-kick-green rounded-full flex items-center justify-center border-2 sm:border-4 border-background shadow-xl">
                    <Trophy className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-kick-dark" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Winner Display */}
          {winner && !isSpinning && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 sm:p-6 rounded-xl bg-kick-green/10 border border-kick-green/30">
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-kick-green animate-pulse" />
                  <h4 className="text-lg sm:text-xl font-bold text-foreground">🎉 Winner! 🎉</h4>
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-kick-green animate-pulse" />
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-kick-green pulse-glow">
                    <AvatarImage src={winner.avatar} />
                    <AvatarFallback className="bg-kick-green text-kick-dark font-bold">
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
                <span>{totalParticipants} participants</span>
              </div>
              {totalParticipants > 12 && (
                <Badge variant="outline" className="text-xs">
                  Showing first 12
                </Badge>
              )}
            </div>
            
            <Button 
              onClick={onSpin}
              disabled={isSpinning || totalParticipants === 0}
              className="gaming-button text-lg px-8 py-3"
              size="lg"
            >
              {isSpinning ? (
                <>
                  <div className="animate-spin mr-2">🎲</div>
                  Spinning...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Spin the Wheel!
                </>
              )}
            </Button>
          </div>

          {/* All Participants List */}
          {totalParticipants > 12 && (
            <Card className="gaming-card mt-6">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Participants ({totalParticipants})
                </h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id}
                      className="flex items-center gap-2 bg-kick-green/10 border border-kick-green/20 rounded-lg px-2 py-1"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="bg-kick-green text-kick-dark text-xs">
                          {participant.username.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground">
                        {participant.isVerified && '🛡️ '}{participant.username}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}