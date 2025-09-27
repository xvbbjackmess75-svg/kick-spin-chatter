import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTwitterAccount } from '@/hooks/useTwitterAccount';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export function LinkTwitterAccount() {
  const { user } = useAuth();
  const { twitterUser, loading: twitterLoading, isTwitterLinked, unlinkTwitterAccount } = useTwitterAccount();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleLinkTwitterAccount = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to link your Twitter account.",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: { action: 'initiate' }
      });

      if (error) {
        console.error('Twitter OAuth initiation error:', error);
        toast({
          title: "Error",
          description: "Failed to initiate Twitter linking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.authUrl) {
        // Store state for verification
        localStorage.setItem('twitter_oauth_state', data.state);
        
        // Redirect to Twitter OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Twitter linking error:', error);
      toast({
        title: "Error",
        description: "Failed to link Twitter account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkTwitterAccount = async () => {
    setIsUnlinking(true);
    try {
      const { error } = await unlinkTwitterAccount();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to unlink Twitter account. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Twitter account unlinked successfully.",
        });
      }
    } catch (error) {
      console.error('Twitter unlinking error:', error);
      toast({
        title: "Error",
        description: "Failed to unlink Twitter account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  // Show loading state while Twitter data is being fetched
  if (twitterLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X (Twitter) Integration
          </CardTitle>
          <CardDescription>
            Loading Twitter account status...
          </CardDescription>
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
        <CardTitle className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X (Twitter) Integration
        </CardTitle>
        <CardDescription>
          Link your X (Twitter) account to your profile for enhanced features and verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTwitterLinked && twitterUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {twitterUser.avatar && (
                <img 
                  src={twitterUser.avatar} 
                  alt="Twitter Avatar"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{twitterUser.displayName}</p>
                <p className="text-sm text-muted-foreground">@{twitterUser.username}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleUnlinkTwitterAccount}
              disabled={isUnlinking}
              className="w-full"
            >
              {isUnlinking ? "Unlinking..." : "Unlink X Account"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your X (Twitter) account to display it on your profile and access X-related features.
            </p>
            <Button 
              onClick={handleLinkTwitterAccount}
              disabled={isLinking}
              className="w-full"
            >
              {isLinking ? "Connecting..." : "Link X Account"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}