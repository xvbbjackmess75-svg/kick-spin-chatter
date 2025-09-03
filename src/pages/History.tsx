import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useHybridAuth } from "@/hooks/useHybridAuth";
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
  winners: Array<{
    id: string;
    winner_username: string;
    winning_ticket?: number;
    total_tickets?: number;
    tickets_per_participant?: number;
    won_at: string;
  }>;
  participants_count: number;
  created_at: string;
  updated_at: string;
  description?: string;
  status: string;
}

export default function History() {
  const { hybridUserId, isAuthenticated, isKickUser, isSupabaseUser, isGuestMode, loading: authLoading } = useHybridAuth();
  const { toast } = useToast();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredWinners, setFilteredWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        console.log("📚 HISTORY: Component mounted, fetching winners...");
        fetchWinners();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    // Filter winners based on search term
    if (searchTerm.trim() === "") {
      setFilteredWinners(winners);
    } else {
      const filtered = winners.filter(giveaway => 
        giveaway.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        giveaway.winners.some(winner => 
          winner.winner_username.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredWinners(filtered);
    }
  }, [winners, searchTerm]);

  const fetchWinners = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      console.log("📚 HISTORY: Fetching winners for user:", hybridUserId);
      
      let query = supabase
        .from('giveaways')
        .select(`
          *,
          giveaway_winners(
            id,
            winner_username,
            winning_ticket,
            total_tickets,
            tickets_per_participant,
            won_at
          )
        `);
      
      // For Supabase users, use normal RLS
      if (isSupabaseUser) {
        query = query.eq('user_id', hybridUserId);
      } else if (isKickUser) {
        // For Kick users, we need to filter by their hybrid ID
        query = query.eq('user_id', hybridUserId);
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });

      console.log("📚 HISTORY: Database query result:", {
        error,
        dataLength: data?.length || 0,
        data: data?.map(d => ({
          id: d.id,
          title: d.title,
          status: d.status,
          winnersCount: d.giveaway_winners?.length || 0,
          updated_at: d.updated_at
        }))
      });

      if (error) throw error;
      
      // Transform data to group winners by giveaway
      const transformedData = data?.map(giveaway => ({
        ...giveaway,
        winners: giveaway.giveaway_winners || []
      })) || [];
      
      setWinners(transformedData);
      console.log("📚 HISTORY: Winners set, total giveaways:", transformedData.length);
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading winning history...</p>
        </div>
      </div>
    );
  }

  // Guest mode - show login message (only if not authenticated)
  if (isGuestMode && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20 bg-gradient-primary/10 rounded-xl border border-primary/20">
            <div className="max-w-md mx-auto px-6">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-foreground mb-4">History</h1>
              <p className="text-xl text-muted-foreground mb-8">
                You need to login to access your giveaway history and winning records.
              </p>
              <Button 
                className="gaming-button" 
                onClick={() => window.location.href = '/auth'}
              >
                Login to View History
              </Button>
            </div>
          </div>
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
                      {winners.reduce((sum, giveaway) => sum + (giveaway.participants_count || 0), 0)}
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
                      {winners.reduce((sum, giveaway) => sum + giveaway.winners.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Winners</p>
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
              {filteredWinners.map((giveaway) => {
                const channelMatch = giveaway.description?.match(/Channel: ([^,]+)/);
                const keywordMatch = giveaway.description?.match(/Keyword: (.+)/);
                const channel = channelMatch?.[1]?.trim();
                const keyword = keywordMatch?.[1]?.trim();

                return (
                  <Card key={giveaway.id} className="gaming-card hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        
                        {/* Giveaway Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-semibold text-foreground">{giveaway.title}</h4>
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
                                <span>{giveaway.participants_count || 0} participants</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                <span>{giveaway.winners.length} winner{giveaway.winners.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`${giveaway.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'} border-0`}>
                              {giveaway.status === 'completed' ? 'Completed' : 'Active'}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Created: {format(new Date(giveaway.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>

                        {/* Winners List */}
                        <div className="space-y-4">
                          <h5 className="text-lg font-medium text-foreground flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-kick-green" />
                            Winners ({giveaway.winners.length})
                          </h5>
                          
                          {giveaway.winners.map((winner, index) => (
                            <div key={winner.id} className="bg-secondary/30 rounded-lg p-4 border">
                              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                
                                {/* Winner Info */}
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-kick-green/20 rounded-full flex items-center justify-center text-kick-green font-bold text-sm">
                                      #{index + 1}
                                    </div>
                                    <Avatar className="w-12 h-12 border-2 border-kick-green/30">
                                      <AvatarImage 
                                        src={`https://files.kick.com/images/user/${winner.winner_username}/profile_image/conversion/300x300-medium.webp`}
                                        alt={winner.winner_username}
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder-avatar.jpg';
                                        }}
                                      />
                                      <AvatarFallback className="bg-kick-green text-kick-dark font-bold">
                                        {winner.winner_username.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div>
                                    <h6 className="font-semibold text-foreground">{winner.winner_username}</h6>
                                    <p className="text-sm text-muted-foreground">
                                      Won on {format(new Date(winner.won_at), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                  </div>
                                </div>

                                {/* Provably Fair Info - Hidden for guest users */}
                                {winner.winning_ticket && !localStorage.getItem('guest_mode') && (
                                  <div className="flex-1">
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                      <div>
                                        <div className="text-lg font-bold text-kick-green">#{winner.winning_ticket}</div>
                                        <div className="text-xs text-muted-foreground">Winning Ticket</div>
                                      </div>
                                      <div>
                                        <div className="text-lg font-bold text-foreground">{winner.total_tickets}</div>
                                        <div className="text-xs text-muted-foreground">Total Tickets</div>
                                      </div>
                                      <div>
                                        <div className="text-lg font-bold text-foreground">{winner.tickets_per_participant}</div>
                                        <div className="text-xs text-muted-foreground">Per Participant</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
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