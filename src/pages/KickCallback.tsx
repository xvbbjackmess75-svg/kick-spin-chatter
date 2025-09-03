import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function KickCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleKickCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

      if (error) {
        toast({
          title: "Authentication Failed",
          description: `Kick authentication failed: ${error}`,
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      if (!code) {
        toast({
          title: "Authentication Error",
          description: "No authorization code received from Kick",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Validate state parameter
      const storedState = localStorage.getItem('kick_oauth_state');
      if (!storedState || storedState !== state) {
        toast({
          title: "Security Error",
          description: "Invalid state parameter. Authentication failed.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      try {
        // Get stored code verifier
        const codeVerifier = localStorage.getItem('kick_code_verifier');
        if (!codeVerifier) {
          throw new Error('Code verifier not found');
        }

        // Exchange code for token using our edge function
        const { data, error: functionError } = await supabase.functions.invoke('kick-oauth-token', {
          body: {
            code,
            codeVerifier,
            redirectUri: `${window.location.origin}/kick-callback`
          }
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        // Store the tokens and user info
        localStorage.setItem('kick_access_token', data.token.access_token);
        localStorage.setItem('kick_refresh_token', data.token.refresh_token);
        localStorage.setItem('kick_user', JSON.stringify(data.user));
        localStorage.setItem('kick_connected', 'true');
        
        // Clean up temporary storage
        localStorage.removeItem('kick_code_verifier');
        localStorage.removeItem('kick_oauth_state');

        toast({
          title: "Kick Integration Successful!",
          description: `Welcome ${data.user.username}! Your Kick account has been connected.`,
          variant: "default"
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
        
      } catch (error) {
        console.error('Kick callback error:', error);
        toast({
          title: "Integration Error",
          description: error.message || "Failed to complete Kick integration. Please try again.",
          variant: "destructive"
        });
        
        // Clean up on error
        localStorage.removeItem('kick_code_verifier');
        localStorage.removeItem('kick_oauth_state');
        
        navigate('/auth');
      }
    };

    handleKickCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Connecting with Kick...</p>
      </div>
    </div>
  );
}