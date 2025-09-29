import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function KickLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleKickLogin = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      // Clear any existing session
      await supabase.auth.signOut();
      
      // Generate authorization URL
      const { data, error } = await supabase.functions.invoke('kick-oauth', {
        body: { action: 'authorize' }
      });

      if (error || !data?.authUrl) {
        throw new Error('Failed to initialize Kick OAuth');
      }

      // Store OAuth state for validation
      if (data.state) {
        sessionStorage.setItem('kick_oauth_state', data.state);
      }
      if (data.codeVerifier) {
        sessionStorage.setItem('kick_oauth_verifier', data.codeVerifier);
      }

      // Redirect to Kick OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Kick login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Unable to start Kick authentication. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Welcome to KickHelper</CardTitle>
          <CardDescription>
            Connect with your Kick account to access all features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button
              onClick={handleKickLogin}
              disabled={isLoading}
              size="lg"
              className="w-full bg-kick-green hover:bg-kick-green/90 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Connecting...
                </>
              ) : (
                'Continue with Kick'
              )}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to link your Kick account
            </p>
            <p className="text-xs text-muted-foreground">
              We only access public profile information
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}