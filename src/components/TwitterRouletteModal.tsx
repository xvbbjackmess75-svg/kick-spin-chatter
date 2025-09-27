import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TwitterGiveawayRoulette } from "@/components/TwitterGiveawayRoulette";
import { TwitterPendingWinners } from "@/components/TwitterPendingWinners";

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

interface TwitterGiveaway {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tweet_id: string;
  tweet_url: string;
  winner_count: number;
  conditions: any;
}

interface TwitterRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  giveaway: TwitterGiveaway;
  onEndGiveaway: () => void;
}

export function TwitterRouletteModal({ 
  isOpen, 
  onClose, 
  giveaway, 
  onEndGiveaway 
}: TwitterRouletteModalProps) {
  const [participants, setParticipants] = useState<TwitterParticipant[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<TwitterParticipant[]>([]);
  const [pendingWinners, setPendingWinners] = useState<TwitterPendingWinner[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [currentPendingWinner, setCurrentPendingWinner] = useState<TwitterPendingWinner | null>(null);
  const [showStartButton, setShowStartButton] = useState(true);
  const { toast } = useToast();

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen && giveaway.id) {
      console.log('TwitterRouletteModal opened for giveaway:', giveaway.id);
      initializeData();
    }
  }, [isOpen, giveaway.id]);

  // Sync participants
  useEffect(() => {
    setCurrentParticipants(participants.filter(p => 
      !pendingWinners.some(w => w.twitter_user_id === p.twitter_user_id)
    ));
  }, [participants, pendingWinners]);

  const initializeData = async () => {
    try {
      // First, analyze the tweet to get participants
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('twitter-giveaway-api', {
        body: { 
          action: 'analyze-tweet',
          tweet_id: giveaway.tweet_id
        }
      });

      if (analysisError) throw analysisError;

      if (analysisData.success) {
        // Process participants based on conditions
        const allEngagedUsers = new Map();
        
        // Add retweeters
        analysisData.retweets?.forEach((user: any) => {
          allEngagedUsers.set(user.id, {
            ...user,
            retweeted: true,
            liked: false,
          });
        });

        // Add likers
        analysisData.likes?.forEach((user: any) => {
          const existing = allEngagedUsers.get(user.id) || { ...user };
          allEngagedUsers.set(user.id, {
            ...existing,
            liked: true,
          });
        });

        // Convert to participant format and check conditions
        const participantList: TwitterParticipant[] = Array.from(allEngagedUsers.values()).map((user: any) => {
          const conditionsMet: any = {};
          let score = 0;

          // Check retweet condition
          if (giveaway.conditions.retweet_required) {
            conditionsMet.retweeted = user.retweeted || false;
            if (user.retweeted) score += 2;
          }

          // Check like condition
          if (giveaway.conditions.like_required) {
            conditionsMet.liked = user.liked || false;
            if (user.liked) score += 1;
          }

          // Basic engagement score
          score += (user.liked ? 1 : 0) + (user.retweeted ? 2 : 0);

          return {
            id: `twitter_${user.id}`,
            twitter_user_id: user.id,
            twitter_username: user.username,
            display_name: user.name,
            profile_image_url: user.profile_image_url,
            conditions_met: conditionsMet,
            engagement_score: score,
          };
        });

        // Filter participants based on conditions
        const eligibleParticipants = participantList.filter(participant => {
          if (giveaway.conditions.retweet_required && !participant.conditions_met.retweeted) {
            return false;
          }
          if (giveaway.conditions.like_required && !participant.conditions_met.liked) {
            return false;
          }
          return true;
        });

        setParticipants(eligibleParticipants);
        console.log('Loaded Twitter participants:', eligibleParticipants.length);
      }

      // Load existing state if any
      const { data: stateData } = await supabase
        .from('twitter_giveaway_states')
        .select('*')
        .eq('giveaway_id', giveaway.id)
        .maybeSingle();

      if (stateData && Array.isArray(stateData.pending_winners)) {
        setPendingWinners(stateData.pending_winners as unknown as TwitterPendingWinner[]);
      }

    } catch (error) {
      console.error('Error initializing Twitter roulette data:', error);
      toast({
        title: "Error",
        description: "Failed to load giveaway data",
        variant: "destructive",
      });
    }
  };

  const handlePendingWinner = (winner: TwitterPendingWinner) => {
    console.log('Adding pending winner:', winner);
    setPendingWinners(prev => [...prev, winner]);
    setCurrentPendingWinner(winner);
    setIsRolling(false);
    setShowStartButton(false);
  };

  const handleRemoveWinner = (winnerToRemove: TwitterPendingWinner) => {
    console.log('Removing winner:', winnerToRemove);
    setPendingWinners(prev => prev.filter(w => w.twitter_user_id !== winnerToRemove.twitter_user_id));
  };

  const handleAcceptAllWinners = async () => {
    try {
      // Save winners to database
      const winnerInserts = pendingWinners.map(winner => ({
        giveaway_id: giveaway.id,
        twitter_user_id: winner.twitter_user_id,
        twitter_username: winner.twitter_username,
        winning_ticket: winner.winning_ticket,
        total_tickets: winner.total_tickets,
      }));

      const { error: winnersError } = await supabase
        .from('twitter_giveaway_winners')
        .insert(winnerInserts);

      if (winnersError) throw winnersError;

      // Update giveaway status
      const { error: giveawayError } = await supabase
        .from('twitter_giveaways')
        .update({ status: 'completed' })
        .eq('id', giveaway.id);

      if (giveawayError) throw giveawayError;

      // Clean up state
      await supabase
        .from('twitter_giveaway_states')
        .delete()
        .eq('giveaway_id', giveaway.id);

      toast({
        title: "Success",
        description: `Giveaway completed with ${pendingWinners.length} winner(s)!`,
      });

      onEndGiveaway();
      onClose();
    } catch (error) {
      console.error('Error ending Twitter giveaway:', error);
      toast({
        title: "Error",
        description: "Failed to end giveaway",
        variant: "destructive",
      });
    }
  };

  const handleAddAnotherWinner = () => {
    setCurrentPendingWinner(null);
    setShowStartButton(true);
  };

  const handleRerollWinner = () => {
    if (currentPendingWinner) {
      handleRemoveWinner(currentPendingWinner);
      setCurrentPendingWinner(null);
      setShowStartButton(true);
    }
  };

  const handleStartNewRoll = () => {
    setCurrentPendingWinner(null);
    setIsRolling(true);
    setShowStartButton(false);
  };

  const handleSaveState = async () => {
    try {
      await supabase
        .from('twitter_giveaway_states')
        .upsert({
          id: `${giveaway.id}_state`,
          giveaway_id: giveaway.id,
          user_id: giveaway.user_id,
          pending_winners: pendingWinners as any,
          remaining_participants: currentParticipants as any,
        });
    } catch (error) {
      console.error('Error saving Twitter giveaway state:', error);
    }
  };

  useEffect(() => {
    if (pendingWinners.length > 0) {
      handleSaveState();
    }
  }, [pendingWinners]);

  const canAddMore = pendingWinners.length < giveaway.winner_count && currentParticipants.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Twitter Giveaway: {giveaway.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {pendingWinners.length > 0 && (
            <TwitterPendingWinners
              winners={pendingWinners}
              onRemoveWinner={handleRemoveWinner}
            />
          )}

          {currentParticipants.length > 0 && (
            <TwitterGiveawayRoulette
              participants={currentParticipants}
              isRolling={isRolling}
              onSelectWinner={handlePendingWinner}
              showStartButton={showStartButton}
              onStartRoll={handleStartNewRoll}
              pendingWinner={currentPendingWinner}
            />
          )}

          {currentParticipants.length === 0 && pendingWinners.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No eligible participants found for this giveaway.</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {pendingWinners.length} of {giveaway.winner_count} winners selected
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>

              {currentPendingWinner && (
                <>
                  <Button variant="outline" onClick={handleRerollWinner}>
                    Reroll
                  </Button>
                  {canAddMore && (
                    <Button onClick={handleAddAnotherWinner}>
                      Add Another Winner
                    </Button>
                  )}
                </>
              )}

              {pendingWinners.length > 0 && (
                <Button onClick={handleAcceptAllWinners}>
                  End Giveaway ({pendingWinners.length} winner{pendingWinners.length !== 1 ? 's' : ''})
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}