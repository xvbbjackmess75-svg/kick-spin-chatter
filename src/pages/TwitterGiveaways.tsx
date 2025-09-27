import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTwitterAccount } from "@/hooks/useTwitterAccount";
import { format } from "date-fns";
import { Trash2, Users, Calendar, Trophy, ExternalLink } from "lucide-react";
import { TwitterAccountGuard } from "@/components/TwitterAccountGuard";
import { TwitterPostSelector } from "@/components/TwitterPostSelector";
import { TwitterConditionsSelector } from "@/components/TwitterConditionsSelector";
import { TwitterRouletteModal } from "@/components/TwitterRouletteModal";

interface TwitterGiveaway {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tweet_id: string;
  tweet_url: string;
  status: string;
  conditions: any;
  winner_count: number;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

export default function TwitterGiveaways() {
  const { user } = useAuth();
  const { isTwitterLinked } = useTwitterAccount();
  const { toast } = useToast();
  
  const [giveaways, setGiveaways] = useState<TwitterGiveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRouletteModal, setShowRouletteModal] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState<TwitterGiveaway | null>(null);
  const [selectedTweet, setSelectedTweet] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    winner_count: 1,
    ends_at: '',
  });
  const [selectedConditions, setSelectedConditions] = useState<any>({});

  const fetchGiveaways = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('twitter_giveaways')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant counts for each giveaway
      const giveawaysWithCounts = await Promise.all(
        (data || []).map(async (giveaway) => {
          const { count } = await supabase
            .from('twitter_giveaway_participants')
            .select('*', { count: 'exact', head: true })
            .eq('giveaway_id', giveaway.id);

          return {
            ...giveaway,
            participant_count: count || 0,
          };
        })
      );

      setGiveaways(giveawaysWithCounts);
    } catch (error) {
      console.error('Error fetching Twitter giveaways:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Twitter giveaways",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
  }, [user]);

  const handleCreateGiveaway = async () => {
    if (!user || !selectedTweet) return;

    try {
      const { error } = await supabase
        .from('twitter_giveaways')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          tweet_id: selectedTweet.id,
          tweet_url: `https://twitter.com/user/status/${selectedTweet.id}`,
          conditions: selectedConditions,
          winner_count: formData.winner_count,
          ends_at: formData.ends_at || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Twitter giveaway created successfully!",
      });

      setShowCreateDialog(false);
      setFormData({ title: '', description: '', winner_count: 1, ends_at: '' });
      setSelectedTweet(null);
      setSelectedConditions({});
      fetchGiveaways();
    } catch (error) {
      console.error('Error creating Twitter giveaway:', error);
      toast({
        title: "Error",
        description: "Failed to create Twitter giveaway",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGiveaway = async (giveawayId: string) => {
    try {
      const { error } = await supabase
        .from('twitter_giveaways')
        .delete()
        .eq('id', giveawayId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Twitter giveaway deleted successfully",
      });

      fetchGiveaways();
    } catch (error) {
      console.error('Error deleting Twitter giveaway:', error);
      toast({
        title: "Error",
        description: "Failed to delete Twitter giveaway",
        variant: "destructive",
      });
    }
  };

  const handleSelectWinners = (giveaway: TwitterGiveaway) => {
    setSelectedGiveaway(giveaway);
    setShowRouletteModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isTwitterLinked) {
    return <TwitterAccountGuard />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Twitter Giveaways</h1>
          <p className="text-muted-foreground mt-2">
            Create giveaways based on Twitter engagement and select winners fairly
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Trophy className="h-4 w-4 mr-2" />
              Create Twitter Giveaway
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Twitter Giveaway</DialogTitle>
              <DialogDescription>
                Select a tweet and set conditions for your Twitter giveaway
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <TwitterPostSelector 
                onTweetSelected={setSelectedTweet}
                selectedTweet={selectedTweet}
              />
              
              {selectedTweet && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Giveaway Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Enter giveaway title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Describe your giveaway"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="winner_count">Number of Winners</Label>
                        <Input
                          id="winner_count"
                          type="number"
                          min={1}
                          max={10}
                          value={formData.winner_count}
                          onChange={(e) => setFormData({...formData, winner_count: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="ends_at">End Date (Optional)</Label>
                        <Input
                          id="ends_at"
                          type="datetime-local"
                          value={formData.ends_at}
                          onChange={(e) => setFormData({...formData, ends_at: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <TwitterConditionsSelector 
                    conditions={selectedConditions}
                    onConditionsChange={setSelectedConditions}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateGiveaway}
                      disabled={!formData.title || !selectedTweet}
                    >
                      Create Giveaway
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : giveaways.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Twitter Giveaways</h3>
            <p className="text-muted-foreground mb-4">
              Create your first Twitter giveaway to engage with your followers
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Twitter Giveaway
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {giveaways.map((giveaway) => (
            <Card key={giveaway.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{giveaway.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {giveaway.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(giveaway.status)}>
                      {giveaway.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGiveaway(giveaway.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {giveaway.participant_count} participants
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    {giveaway.winner_count} winners
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created: {format(new Date(giveaway.created_at), 'MMM d, yyyy')}
                  </div>
                  {giveaway.ends_at && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Ends: {format(new Date(giveaway.ends_at), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(giveaway.tweet_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Tweet
                  </Button>
                  
                  {giveaway.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => handleSelectWinners(giveaway)}
                    >
                      Select Winners
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedGiveaway && (
        <TwitterRouletteModal
          isOpen={showRouletteModal}
          onClose={() => {
            setShowRouletteModal(false);
            setSelectedGiveaway(null);
          }}
          giveaway={selectedGiveaway}
          onEndGiveaway={fetchGiveaways}
        />
      )}
    </div>
  );
}