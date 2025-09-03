import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const username = searchParams.get('username');
      const sessionUrl = searchParams.get('session_url');
      const error = searchParams.get('error');

      if (error) {
        toast({
          title: "Authentication failed",
          description: error,
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      if (success === 'true' && sessionUrl) {
        try {
          // Extract the token from the session URL
          const url = new URL(sessionUrl);
          const token = url.searchParams.get('token');
          
          if (token) {
            const { error: sessionError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'magiclink'
            });

            if (sessionError) {
              console.error('Session verification error:', sessionError);
              throw sessionError;
            }

            toast({
              title: "Welcome!",
              description: `Successfully signed in with Kick as ${username}`,
            });
            
            navigate('/');
          } else {
            throw new Error('No session token received');
          }
        } catch (error) {
          console.error('Session handling error:', error);
          toast({
            title: "Session error",
            description: "Failed to establish session. Please try again.",
            variant: "destructive"
          });
          navigate('/auth');
        }
      } else {
        navigate('/auth');
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-kick-green" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}