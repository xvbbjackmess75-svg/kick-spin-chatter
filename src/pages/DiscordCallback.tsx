import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDiscordAccount } from '@/hooks/useDiscordAccount';
import { supabase } from '@/integrations/supabase/client';

export default function DiscordCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { linkDiscordAccount } = useDiscordAccount();

  useEffect(() => {
    let isProcessing = false;
    
    const handleCallback = async () => {
      if (isProcessing) {
        console.log('🔄 Discord callback already processing, skipping...');
        return;
      }
      
      console.log('🔄 Discord callback - user:', user?.email || 'null', 'authLoading:', authLoading);
      
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Discord callback waiting for auth to load...');
        return;
      }

      isProcessing = true;
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        toast({
          title: "Discord Authentication Failed",
          description: "Discord authentication was cancelled or failed",
          variant: "destructive"
        });
        navigate('/viewer-verification');
        return;
      }

      if (!code) {
        toast({
          title: "Invalid Callback",
          description: "No authorization code received from Discord",
          variant: "destructive"
        });
        navigate('/viewer-verification');
        return;
      }

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to link Discord account",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      try {
        console.log('🔄 Processing Discord callback...');
        
        // Exchange code for tokens using our edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('discord-oauth', {
          body: {
            action: 'exchange',
            code,
            state
          }
        });

        if (exchangeError) throw exchangeError;

        console.log('✅ Got Discord user data:', data.user.username);

        // Link the Discord account to the user's profile
        await linkDiscordAccount({
          id: data.user.id,
          username: data.user.username,
          discriminator: data.user.discriminator,
          avatar: data.user.avatar,
          global_name: data.user.global_name
        });

        toast({
          title: "Discord Account Linked!",
          description: `Your Discord account @${data.user.username} has been successfully connected`,
        });

        navigate('/viewer-verification');

      } catch (error) {
        console.error('❌ Discord callback error:', error);
        toast({
          title: "Discord Linking Failed",
          description: "Failed to link Discord account. Please try again.",
          variant: "destructive"
        });
        navigate('/viewer-verification');
      } finally {
        isProcessing = false;
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast, user, linkDiscordAccount, authLoading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green mx-auto" />
        <p className="text-muted-foreground">Processing Discord authentication...</p>
      </div>
    </div>
  );
}