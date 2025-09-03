import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="gaming-card">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-accent" />
              Giveaway Roulette
            </h3>
            <p className="text-muted-foreground">
              {totalParticipants} participants ready to win!
            </p>
          </div>

          {/* Roulette Wheel Container */}
          <div className="relative">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-accent drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <div className="relative w-80 h-80 mx-auto">
              <div 
                className={`w-full h-full rounded-full border-4 border-accent/30 overflow-hidden relative ${animationClass}`}
                style={{ 
                  transform: `rotate(${currentRotation}deg)`,
                  background: 'conic-gradient(from 0deg, var(--gradient-primary), var(--kick-purple), var(--accent), var(--primary))'
                }}
              >
                {/* Participant Avatars */}
                {participants.slice(0, 12).map((participant, index) => {
                  const angle = (index * segmentAngle) - 90; // Start from top
                  const radius = 120; // Distance from center
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <div
                      key={participant.id}
                      className="absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 floating-element"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <Avatar className="w-12 h-12 border-2 border-background shadow-lg">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                          {participant.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  );
                })}

                {/* Center Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                    <Trophy className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Winner Display */}
          {winner && !isSpinning && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-6 rounded-xl bg-gradient-primary/10 border border-primary/30">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Trophy className="h-8 w-8 text-accent animate-pulse" />
                  <h4 className="text-xl font-bold text-foreground">🎉 Winner! 🎉</h4>
                  <Trophy className="h-8 w-8 text-accent animate-pulse" />
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="w-16 h-16 border-4 border-accent pulse-glow">
                    <AvatarImage src={winner.avatar} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                      {winner.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{winner.username}</p>
                    <Badge className="bg-accent/20 text-accent border-accent/30 mt-1">
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
                      className="flex items-center gap-2 bg-secondary/30 rounded-lg px-2 py-1"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
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
        </div>
      </CardContent>
    </Card>
  );
}