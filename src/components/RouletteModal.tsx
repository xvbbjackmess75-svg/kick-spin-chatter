import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GiveawayRoulette } from "./GiveawayRoulette";
import { PendingWinners } from "./PendingWinners";
import { Crown, Trophy, RotateCcw, Play } from 'lucide-react';

interface Participant {
  id: number;
  username: string;
  avatar?: string;
}

interface PendingWinner {
  id: number;
  username: string;
  avatar?: string;
  winningTicket: number;
  totalTickets: number;
  ticketsPerParticipant: number;
}

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  giveaway: any;
  participants: Participant[];
  onEndGiveaway: (winners: PendingWinner[]) => void;
}

export function RouletteModal({ 
  isOpen, 
  onClose, 
  giveaway, 
  participants, 
  onEndGiveaway 
}: RouletteModalProps) {
  const [pendingWinners, setPendingWinners] = useState<PendingWinner[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<Participant[]>(participants);
  const [isRolling, setIsRolling] = useState(false);
  const [currentPendingWinner, setCurrentPendingWinner] = useState<Participant | null>(null);
  const [showStartButton, setShowStartButton] = useState(true);

  // Handle adding a winner to pending list
  const handlePendingWinner = (winner: Participant, result: any) => {
    console.log("🎯 Adding winner to pending list:", winner.username);
    
    const newWinner: PendingWinner = {
      id: Date.now(),
      username: winner.username,
      avatar: winner.avatar,
      winningTicket: result.winningTicket,
      totalTickets: result.totalTickets,
      ticketsPerParticipant: result.ticketsPerParticipant
    };

    setPendingWinners(prev => [...prev, newWinner]);
    
    // Remove winner from available participants
    setCurrentParticipants(prev => prev.filter(p => p.username !== winner.username));
    
    // Reset current winner state
    setCurrentPendingWinner(null);
    setShowStartButton(true);
    setIsRolling(false);
  };

  // Handle removing a winner from pending list
  const handleRemoveWinner = (winnerId: number) => {
    const winnerToRemove = pendingWinners.find(w => w.id === winnerId);
    if (winnerToRemove) {
      // Add back to participants
      const participant: Participant = {
        id: Date.now(),
        username: winnerToRemove.username,
        avatar: winnerToRemove.avatar
      };
      setCurrentParticipants(prev => [...prev, participant]);
      
      // Remove from pending winners
      setPendingWinners(prev => prev.filter(w => w.id !== winnerId));
    }
  };

  // Handle accepting all winners and ending giveaway
  const handleAcceptAllWinners = () => {
    onEndGiveaway(pendingWinners);
    onClose();
  };

  // Handle adding another winner
  const handleAddAnotherWinner = () => {
    if (currentParticipants.length === 0) {
      console.log("❌ No more participants available");
      return;
    }
    
    console.log("🎯 Adding another winner - available participants:", currentParticipants.length);
    setShowStartButton(false);
    setIsRolling(true);
  };

  // Handle reroll
  const handleRerollWinner = () => {
    console.log("🔄 Rerolling current winner");
    setCurrentPendingWinner(null);
    setShowStartButton(false);
    setIsRolling(true);
  };

  // Handle starting new roll
  const handleStartNewRoll = () => {
    console.log("🎰 Starting new roll");
    setShowStartButton(false);
    setIsRolling(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gaming-card max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-kick-green" />
            {giveaway?.title} - Winner Selection
            <Badge variant="outline" className="ml-auto">
              {currentParticipants.length} remaining
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pending Winners Display */}
          {pendingWinners.length > 0 && (
            <PendingWinners
              pendingWinners={pendingWinners}
              onRemoveWinner={handleRemoveWinner}
              onAcceptAllWinners={handleAcceptAllWinners}
              onAddAnotherWinner={handleAddAnotherWinner}
              isRolling={isRolling}
            />
          )}

          {/* Roulette Component */}
          {currentParticipants.length > 0 ? (
            <GiveawayRoulette
              participants={currentParticipants}
              onPendingWinner={handlePendingWinner}
              onRerollWinner={handleRerollWinner}
              onStartNewRoll={handleStartNewRoll}
              currentPendingWinner={currentPendingWinner}
              showStartButton={showStartButton}
            />
          ) : (
            <div className="text-center py-12 bg-secondary/20 rounded-lg border border-accent/20">
              <Trophy className="h-16 w-16 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">All Participants Selected</h3>
              <p className="text-muted-foreground mb-6">
                You've selected winners from all available participants. 
                {pendingWinners.length > 0 ? " Accept the winners to end the giveaway." : ""}
              </p>
              {pendingWinners.length > 0 && (
                <Button onClick={handleAcceptAllWinners} className="gaming-button">
                  <Trophy className="h-4 w-4 mr-2" />
                  End Giveaway & Accept All Winners
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            
            {pendingWinners.length > 0 && (
              <Button 
                onClick={handleAcceptAllWinners}
                className="gaming-button flex-1"
              >
                <Trophy className="h-4 w-4 mr-2" />
                End Giveaway ({pendingWinners.length} winner{pendingWinners.length > 1 ? 's' : ''})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}