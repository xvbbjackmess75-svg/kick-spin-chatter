import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ExternalLink, BarChart3, Heart, Repeat2, MessageCircle } from "lucide-react";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

interface TwitterPostSelectorProps {
  onTweetSelected: (tweet: Tweet | null) => void;
  selectedTweet: Tweet | null;
}

export function TwitterPostSelector({ onTweetSelected, selectedTweet }: TwitterPostSelectorProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTweets = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('twitter-giveaway-api', {
        body: { action: 'get-tweets' }
      });

      if (error) throw error;

      if (data.success) {
        setTweets(data.tweets);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your tweets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Tweet</CardTitle>
          <CardDescription>Choose one of your recent tweets for the giveaway</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Tweet</CardTitle>
        <CardDescription>
          Choose one of your recent tweets for the giveaway
          {selectedTweet && (
            <Badge className="ml-2">Selected</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tweets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent tweets found.</p>
            <Button 
              variant="outline" 
              onClick={fetchTweets}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tweets.map((tweet) => (
              <Card 
                key={tweet.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedTweet?.id === tweet.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onTweetSelected(selectedTweet?.id === tweet.id ? null : tweet)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <p className="text-sm line-clamp-3">{tweet.text}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(tweet.created_at), 'MMM d, yyyy HH:mm')}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {tweet.public_metrics.like_count}
                        </div>
                        <div className="flex items-center">
                          <Repeat2 className="h-3 w-3 mr-1" />
                          {tweet.public_metrics.retweet_count}
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {tweet.public_metrics.reply_count}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://twitter.com/user/status/${tweet.id}`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}