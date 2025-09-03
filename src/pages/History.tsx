import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Trophy, 
  Calendar, 
  Search, 
  Filter,
  Crown,
  Gift,
  Users,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface Winner {
  id: string;
  title: string;
  winner_user_id: string;
  participants_count: number;
  created_at: string;
  updated_at: string;
  description?: string;
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredWinners, setFilteredWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (user) {
      fetchWinners();
    }
  }, [user]);

  useEffect(() => {
    // Filter winners based on search term
    if (searchTerm.trim() === "") {
      setFilteredWinners(winners);
    } else {
      const filtered = winners.filter(winner => 
        winner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        winner.winner_user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWinners(filtered);
    }
  }, [winners, searchTerm]);

  const fetchWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .not('winner_user_id', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setWinners(data || []);
    } catch (error) {
      console.error('Error fetching winners:', error);
      toast({
        title: "Error",
        description: "Failed to fetch winning history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading winning history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-kick-green to-kick-purple bg-clip-text text-transparent">
              Winning History
            </h1>
            <p className="text-lg text-muted-foreground">
              Complete history of all your giveaway winners and results
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by giveaway title or winner username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="gaming-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-kick-green/10 rounded-lg">
                    <Trophy className="h-6 w-6 text-kick-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{winners.length}</p>
                    <p className="text-sm text-muted-foreground">Total Giveaways</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gaming-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-kick-purple/10 rounded-lg">
                    <Users className="h-6 w-6 text-kick-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {winners.reduce((sum, winner) => sum + (winner.participants_count || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gaming-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Crown className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(winners.map(w => w.winner_user_id)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Unique Winners</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Winners List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-kick-green" />
            <h2 className="text-2xl font-semibold">Winners ({filteredWinners.length})</h2>
          </div>

          {filteredWinners.length === 0 ? (
            <Card className="border-dashed border-muted-foreground/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? "No Results Found" : "No Winners Yet"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchTerm 
                    ? "Try adjusting your search terms to find what you're looking for."
                    : "Complete some giveaways to see your winning history here!"
                  }
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredWinners.map((winner) => {
                const channelMatch = winner.description?.match(/Channel: ([^,]+)/);
                const keywordMatch = winner.description?.match(/Keyword: (.+)/);
                const channel = channelMatch?.[1]?.trim();
                const keyword = keywordMatch?.[1]?.trim();

                return (
                  <Card key={winner.id} className="gaming-card hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        
                        {/* Winner Info */}
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16 border-4 border-kick-green/30">
                            <AvatarImage 
                              src={`https://kick.com/api/v2/channels/${winner.winner_user_id}/avatar`}
                              alt={winner.winner_user_id}
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-avatar.jpg';
                              }}
                            />
                            <AvatarFallback className="bg-kick-green text-kick-dark font-bold">
                              {winner.winner_user_id.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{winner.winner_user_id}</h3>
                            <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30">
                              <Crown className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          </div>
                        </div>

                        {/* Giveaway Details */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <h4 className="text-lg font-semibold text-foreground">{winner.title}</h4>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              {channel && (
                                <div className="flex items-center gap-1">
                                  <Gift className="h-3 w-3" />
                                  <span>Channel: {channel}</span>
                                </div>
                              )}
                              {keyword && (
                                <div className="flex items-center gap-1">
                                  <span>Keyword:</span>
                                  <code className="bg-secondary px-1 py-0.5 rounded text-xs">{keyword}</code>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{winner.participants_count || 0} participants</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Date Info */}
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Won on</span>
                          </div>
                          <p className="text-sm font-medium">
                            {format(new Date(winner.updated_at), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(winner.updated_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}