import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function DiscordCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
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

      try {
        // Exchange code for tokens using our edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('discord-oauth', {
          body: {
            action: 'exchange',
            code,
            state
          }
        });

        if (exchangeError) throw exchangeError;

        // Store Discord user data
        const discordUser = {
          id: data.user.id,
          username: data.user.username,
          discriminator: data.user.discriminator,
          avatar: data.user.avatar,
          global_name: data.user.global_name,
          authenticated: true
        };

        // Store in localStorage for now (you might want to store in Supabase later)
        if (user) {
          localStorage.setItem(`discord_user_${user.id}`, JSON.stringify(discordUser));
          localStorage.setItem(`discord_linked_${user.id}`, 'true');
        }

        toast({
          title: "Discord Account Linked!",
          description: "Your Discord account has been successfully connected",
        });

        navigate('/viewer-verification');

      } catch (error) {
        console.error('Discord callback error:', error);
        toast({
          title: "Discord Linking Failed",
          description: "Failed to link Discord account. Please try again.",
          variant: "destructive"
        });
        navigate('/viewer-verification');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green mx-auto" />
        <p className="text-muted-foreground">Processing Discord authentication...</p>
      </div>
    </div>
  );
}