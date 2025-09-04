import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, X, Trophy } from "lucide-react";

interface PendingWinner {
  id: number;
  username: string;
  avatar?: string;
  winningTicket: number;
  totalTickets: number;
  ticketsPerParticipant: number;
}

interface PendingWinnersProps {
  pendingWinners: PendingWinner[];
  onRemoveWinner: (winnerId: number) => void;
  onAcceptAllWinners: () => void;
  onAddAnotherWinner: () => void;
  isRolling: boolean;
}

export function PendingWinners({ 
  pendingWinners, 
  onRemoveWinner, 
  onAcceptAllWinners, 
  onAddAnotherWinner,
  isRolling 
}: PendingWinnersProps) {
  if (pendingWinners.length === 0) {
    return null;
  }

  return (
    <Card className="gaming-card mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-accent" />
          Pending Winners ({pendingWinners.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winners List */}
        <div className="space-y-3">
          {pendingWinners.map((winner, index) => (
            <div 
              key={winner.id} 
              className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border animate-fade-in"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                    #{index + 1}
                  </div>
                  <Avatar className="w-12 h-12 border-2 border-accent/30">
                    <AvatarImage 
                      src={winner.avatar}
                      alt={winner.username}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-avatar.jpg';
                      }}
                    />
                    <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                      {winner.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h6 className="font-semibold text-foreground">{winner.username}</h6>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Ticket #{winner.winningTicket}</span>
                    <span>{winner.totalTickets} total tickets</span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveWinner(winner.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={onAddAnotherWinner}
            variant="outline"
            disabled={isRolling}
            className="flex-1"
          >
            <Crown className="h-4 w-4 mr-2" />
            {pendingWinners.length === 1 ? 'Pick Another Winner' : 'Add More Winners'}
          </Button>
          
          <Button 
            onClick={onAcceptAllWinners}
            className="flex-1 gaming-button"
            disabled={isRolling}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Accept All Winners & End Giveaway
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}