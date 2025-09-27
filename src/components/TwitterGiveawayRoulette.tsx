import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Repeat2, User, Trophy } from "lucide-react";

interface TwitterParticipant {
  id: string;
  twitter_user_id: string;
  twitter_username: string;
  display_name?: string;
  profile_image_url?: string;
  conditions_met: any;
  engagement_score: number;
}

interface TwitterPendingWinner {
  id: string;
  twitter_user_id: string;
  twitter_username: string;
  display_name?: string;
  profile_image_url?: string;
  winning_ticket: number;
  total_tickets: number;
}

interface TwitterGiveawayRouletteProps {
  participants: TwitterParticipant[];
  isRolling: boolean;
  onSelectWinner: (winner: TwitterPendingWinner) => void;
  showStartButton: boolean;
  onStartRoll: () => void;
  pendingWinner: TwitterPendingWinner | null;
}

export function TwitterGiveawayRoulette({
  participants,
  isRolling,
  onSelectWinner,
  showStartButton,
  onStartRoll,
  pendingWinner
}: TwitterGiveawayRouletteProps) {
  const [currentParticipant, setCurrentParticipant] = useState<TwitterParticipant | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<TwitterParticipant | null>(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create weighted tickets based on engagement score
  const createTickets = () => {
    const tickets: TwitterParticipant[] = [];
    participants.forEach(participant => {
      const ticketCount = Math.max(1, participant.engagement_score || 1);
      for (let i = 0; i < ticketCount; i++) {
        tickets.push(participant);
      }
    });
    return tickets;
  };

  const startRoulette = () => {
    const tickets = createTickets();
    let speed = 50;
    let iterations = 0;
    const maxIterations = 100 + Math.random() * 100;

    intervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * tickets.length);
      setCurrentParticipant(tickets[randomIndex]);

      iterations++;
      if (iterations > maxIterations * 0.7) {
        speed = Math.min(speed + 10, 200);
      }

      if (iterations >= maxIterations) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        // Select final winner
        const finalWinnerIndex = Math.floor(Math.random() * tickets.length);
        const finalWinner = tickets[finalWinnerIndex];
        
        const winnerTicket = finalWinnerIndex + 1;
        const totalTickets = tickets.length;

        const pendingWinner: TwitterPendingWinner = {
          id: finalWinner.id,
          twitter_user_id: finalWinner.twitter_user_id,
          twitter_username: finalWinner.twitter_username,
          display_name: finalWinner.display_name,
          profile_image_url: finalWinner.profile_image_url,
          winning_ticket: winnerTicket,
          total_tickets: totalTickets,
        };

        setSelectedWinner(finalWinner);
        setShowWinnerDialog(true);
        setTimeout(() => {
          onSelectWinner(pendingWinner);
        }, 2000);
      }
    }, speed);
  };

  useEffect(() => {
    if (isRolling && participants.length > 0) {
      startRoulette();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRolling, participants]);

  const handleParticipantClick = (participant: TwitterParticipant) => {
    setSelectedWinner(participant);
    setShowWinnerDialog(true);
  };

  const getTicketCount = (participant: TwitterParticipant) => {
    return Math.max(1, participant.engagement_score || 1);
  };

  const totalTickets = participants.reduce((sum, p) => sum + getTicketCount(p), 0);

  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No participants available for rolling</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Twitter Participants ({participants.length})</span>
            <div className="text-sm font-normal text-muted-foreground">
              Total Tickets: {totalTickets}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRolling && currentParticipant && (
            <div className="text-center py-8 border-2 border-primary rounded-lg bg-primary/5">
              <div className="animate-bounce">
                <Avatar className="h-16 w-16 mx-auto mb-4">
                  <AvatarImage src={currentParticipant.profile_image_url} />
                  <AvatarFallback>
                    {currentParticipant.twitter_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">@{currentParticipant.twitter_username}</h3>
                <p className="text-muted-foreground">{currentParticipant.display_name}</p>
              </div>
            </div>
          )}

          {!isRolling && showStartButton && (
            <div className="text-center py-4">
              <Button onClick={onStartRoll} size="lg">
                <Trophy className="h-4 w-4 mr-2" />
                Start Rolling
              </Button>
            </div>
          )}

          {pendingWinner && (
            <div className="text-center py-8 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-950">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-xl font-bold">Winner Selected!</h3>
              <p className="text-lg">@{pendingWinner.twitter_username}</p>
              <p className="text-sm text-muted-foreground">
                Ticket {pendingWinner.winning_ticket} of {pendingWinner.total_tickets}
              </p>
            </div>
          )}

          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleParticipantClick(participant)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={participant.profile_image_url} />
                    <AvatarFallback>
                      {participant.twitter_username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">@{participant.twitter_username}</p>
                    {participant.display_name && (
                      <p className="text-sm text-muted-foreground">{participant.display_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {participant.conditions_met.liked && (
                      <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                        <Heart className="h-3 w-3" />
                      </Badge>
                    )}
                    {participant.conditions_met.retweeted && (
                      <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                        <Repeat2 className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">
                    {getTicketCount(participant)} ticket{getTicketCount(participant) !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participant Details</DialogTitle>
          </DialogHeader>
          
          {selectedWinner && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedWinner.profile_image_url} />
                  <AvatarFallback>
                    {selectedWinner.twitter_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">@{selectedWinner.twitter_username}</h3>
                  {selectedWinner.display_name && (
                    <p className="text-muted-foreground">{selectedWinner.display_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Engagement</h4>
                <div className="flex space-x-2">
                  {selectedWinner.conditions_met.liked && (
                    <Badge variant="secondary">
                      <Heart className="h-3 w-3 mr-1" />
                      Liked
                    </Badge>
                  )}
                  {selectedWinner.conditions_met.retweeted && (
                    <Badge variant="secondary">
                      <Repeat2 className="h-3 w-3 mr-1" />
                      Retweeted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Engagement Score: {selectedWinner.engagement_score} 
                  ({getTicketCount(selectedWinner)} ticket{getTicketCount(selectedWinner) !== 1 ? 's' : ''})
                </p>
              </div>

              <Button 
                onClick={() => window.open(`https://twitter.com/${selectedWinner.twitter_username}`, '_blank')}
                variant="outline"
              >
                <User className="h-4 w-4 mr-2" />
                View Twitter Profile
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}