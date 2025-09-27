import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, Trophy, ExternalLink } from "lucide-react";

interface TwitterPendingWinner {
  id: string;
  twitter_user_id: string;
  twitter_username: string;
  display_name?: string;
  profile_image_url?: string;
  winning_ticket: number;
  total_tickets: number;
}

interface TwitterPendingWinnersProps {
  winners: TwitterPendingWinner[];
  onRemoveWinner: (winner: TwitterPendingWinner) => void;
}

export function TwitterPendingWinners({ winners, onRemoveWinner }: TwitterPendingWinnersProps) {
  if (winners.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Selected Winners ({winners.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {winners.map((winner, index) => (
            <div
              key={winner.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
            >
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  #{index + 1}
                </Badge>
                <Avatar>
                  <AvatarImage src={winner.profile_image_url} />
                  <AvatarFallback>
                    {winner.twitter_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">@{winner.twitter_username}</p>
                  {winner.display_name && (
                    <p className="text-sm text-muted-foreground">{winner.display_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Ticket {winner.winning_ticket} of {winner.total_tickets}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://twitter.com/${winner.twitter_username}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveWinner(winner)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}