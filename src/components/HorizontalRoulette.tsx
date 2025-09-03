import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Users, Zap, Crown, Shield } from "lucide-react";

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

// Provably fair system
interface DrawResult {
  clientSeed: string;
  serverSeed: string;
  nonce: number;
  hash: string;
  winnerTicket: number;
  totalTickets: number;
  landingOffset: number;
}

export function HorizontalRoulette({ participants, isSpinning, onSpin, winner }: HorizontalRouletteProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastWinnerId, setLastWinnerId] = useState<number | null>(null);

  // Provably fair system functions
  const generateClientSeed = () => Math.random().toString(36).substring(2, 15);
  
  const generateServerSeed = () => Math.random().toString(36).substring(2, 15);
  
  const hashSeeds = (clientSeed: string, serverSeed: string, nonce: number) => {
    const data = `${clientSeed}:${serverSeed}:${nonce}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  };

  const selectWinnerTicket = (participants: Participant[]) => {
    const clientSeed = generateClientSeed();
    const serverSeed = generateServerSeed();
    const nonce = Date.now();
    const hash = hashSeeds(clientSeed, serverSeed, nonce);
    
    // Create ticket system - each participant gets one ticket
    const totalTickets = participants.length;
    
    // Use hash to determine winner ticket
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const winnerTicket = hashInt % totalTickets;
    
    // Random offset within avatar bounds for landing position (-20 to +20 pixels)
    const landingOffset = (hashInt % 41) - 20; // Range: -20 to +20
    
    return {
      clientSeed,
      serverSeed,
      nonce,
      hash,
      winnerTicket,
      totalTickets,
      landingOffset
    };
  };

  // Create simple extended participants array for infinite scrolling
  const extendedParticipants = useMemo(() => {
    if (participants.length === 0) return [];
    
    // Create enough repetitions to handle any scroll distance
    const repetitions = 200; // Simple approach: repeat participants 200 times
    const extended = [];
    
    for (let i = 0; i < repetitions; i++) {
      participants.forEach((participant, index) => {
        extended.push({
          ...participant,
          uniqueKey: `${participant.id}-cycle-${i}-${index}`
        });
      });
    }
    
    return extended;
  }, [participants]);

  useEffect(() => {
    if (isSpinning && participants.length > 0 && !isAnimating) {
      setIsAnimating(true);
      setShowWinner(false);
      
      // ALWAYS reset to start position for consistent behavior
      console.log("Resetting roulette to start position");
      setScrollPosition(0);
      
      const participantWidth = 80;
      const containerWidth = 800;
      const centerLinePosition = containerWidth / 2;
      
      // Generate provably fair result - this determines the actual landing position
      const result = selectWinnerTicket(participants);
      setDrawResult(result);
      
      // ALWAYS use provably fair winner for positioning calculation
      const targetWinner = participants[result.winnerTicket];
      console.log("Provably fair winner:", targetWinner.username, "at index:", result.winnerTicket);
      
      // Find ALL positions where this provably fair winner appears in the extended array
      const winnerPositions = [];
      extendedParticipants.forEach((participant, index) => {
        if (participant.id === targetWinner.id) {
          winnerPositions.push(index);
        }
      });
      
      console.log("Winner appears at positions:", winnerPositions.slice(0, 10));
      
      // Choose a position that gives us a good spin effect (at least 20 full cycles)
      const minScrollDistance = 20 * participants.length * participantWidth; // 20 complete cycles minimum
      const minPosition = Math.ceil(minScrollDistance / participantWidth);
      
      const suitablePositions = winnerPositions.filter(pos => pos >= minPosition);
      
      if (suitablePositions.length === 0) {
        console.error("No suitable winner positions found, using fallback");
        setIsAnimating(false);
        return;
      }
      
      // Choose the first suitable position for consistency
      const chosenPosition = suitablePositions[0];
      
      console.log("Chosen position:", chosenPosition, "for winner:", targetWinner.username);
      
      // Calculate the exact scroll position needed
      const avatarLeftEdge = chosenPosition * participantWidth;
      const avatarCenter = avatarLeftEdge + (participantWidth / 2);
      
      // Calculate scroll to center the avatar on the center line
      let finalScrollPosition = avatarCenter - centerLinePosition;
      
      // Add the provably fair landing offset
      finalScrollPosition += result.landingOffset;
      
      console.log("Final scroll calculation:", {
        chosenPosition,
        avatarLeftEdge,
        avatarCenter,
        centerLinePosition,
        landingOffset: result.landingOffset,
        finalScrollPosition
      });
      
      // Apply the scroll with a slight delay to ensure reset is processed
      setTimeout(() => {
        console.log("Setting final scroll position:", finalScrollPosition);
        setScrollPosition(finalScrollPosition);
      }, 100);
      
      // Animation complete handler
      const animationDuration = 5000;
      setTimeout(() => {
        setIsAnimating(false);
      }, animationDuration + 100); // Add buffer for the delayed scroll
      
      // Show winner announcement (show the passed winner prop, but position was calculated with provably fair)
      if (winner) {
        setTimeout(() => {
          setShowWinner(true);
        }, animationDuration + 1500);
      }
    }
  }, [isSpinning, participants, winner, isAnimating, extendedParticipants]);

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
                transition: isAnimating ? 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
              }}
            >
              {extendedParticipants.map((participant) => (
                <div
                  key={participant.uniqueKey}
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
        {winner && showWinner && (
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
            {drawResult && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Provably Fair
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-kick-green" />
                      Provably Fair Verification
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium text-foreground">Client Seed:</p>
                      <p className="text-muted-foreground font-mono break-all">{drawResult.clientSeed}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Server Seed:</p>
                      <p className="text-muted-foreground font-mono break-all">{drawResult.serverSeed}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Nonce:</p>
                      <p className="text-muted-foreground font-mono">{drawResult.nonce}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Hash:</p>
                      <p className="text-muted-foreground font-mono break-all">{drawResult.hash}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="font-medium text-foreground">Result:</p>
                      <p className="text-muted-foreground">
                        Ticket #{drawResult.winnerTicket + 1} of {drawResult.totalTickets} total tickets
                      </p>
                      <p className="text-muted-foreground">
                        Landing offset: {drawResult.landingOffset}px
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                      <p className="font-medium mb-1">How to verify:</p>
                      <p>Hash the seeds with nonce and modulo by total tickets to get the winning ticket number.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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