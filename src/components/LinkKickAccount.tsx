import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useKickAccount } from '@/hooks/useKickAccount';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Unlink, UserCheck } from 'lucide-react';

export function LinkKickAccount() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { kickUser, isKickLinked } = useKickAccount();
  const { user } = useAuth();

  const handleLinkKickAccount = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to link your Kick account.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔗 Starting Kick account linking...');
      
      // Set linking mode flag
      sessionStorage.setItem('kick_linking_mode', 'true');
      
      const response = await supabase.functions.invoke('kick-oauth', {
        body: { 
          action: 'authorize',
          origin: window.location.origin
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { authUrl, codeVerifier } = response.data;
      
      if (authUrl) {
        // Store code verifier for callback
        sessionStorage.setItem('kick_code_verifier', codeVerifier);
        
        toast({
          title: "Redirecting to Kick",
          description: "You'll be redirected to Kick.com to authorize the link.",
        });
        
        // Redirect to Kick OAuth
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate Kick linking:', error);
      toast({
        title: "Failed to Start Linking",
        description: "Please try again.",
        variant: "destructive"
      });
      sessionStorage.removeItem('kick_linking_mode');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkKickAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Clear Kick data from profile
      const { error } = await supabase
        .from('profiles')
        .update({
          linked_kick_user_id: null,
          linked_kick_username: null,
          linked_kick_avatar: null,
          is_kick_hybrid: false,
          kick_user_id: null,
          kick_username: null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear local storage
      localStorage.removeItem('kick_user');
      localStorage.removeItem('kick_token');
      localStorage.removeItem('kick_hybrid_session');

      toast({
        title: "Account Unlinked",
        description: "Your Kick account has been unlinked successfully.",
      });
    } catch (error) {
      console.error('Failed to unlink Kick account:', error);
      toast({
        title: "Failed to Unlink",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="gaming-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-kick-green" />
          Kick.com Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isKickLinked && kickUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-kick-green/10 rounded-lg border border-kick-green/20">
              <UserCheck className="h-5 w-5 text-kick-green" />
              <div>
                <p className="font-medium text-foreground">Linked to @{kickUser.username}</p>
                <p className="text-sm text-muted-foreground">
                  Your Kick account is connected and ready to use
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleUnlinkKickAccount}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              <Unlink className="h-4 w-4 mr-2" />
              {loading ? 'Unlinking...' : 'Unlink Kick Account'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Link your Kick.com account to access chat monitoring, giveaways, and bot features.
              </p>
            </div>
            
            <Button
              onClick={handleLinkKickAccount}
              disabled={loading}
              className="gaming-button w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {loading ? 'Connecting...' : 'Link Kick Account'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}