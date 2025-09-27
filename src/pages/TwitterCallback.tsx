import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTwitterAccount } from '@/hooks/useTwitterAccount';
import { useToast } from '@/hooks/use-toast';

export default function TwitterCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { linkTwitterAccount } = useTwitterAccount();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          console.error('Twitter OAuth error:', error);
          toast({
            title: "Twitter Authentication Failed",
            description: "You cancelled the Twitter authentication or an error occurred.",
            variant: "destructive",
          });
          navigate('/account');
          return;
        }

        if (!code || !state) {
          console.error('Missing code or state in Twitter callback');
          toast({
            title: "Authentication Error",
            description: "Invalid Twitter authentication response.",
            variant: "destructive",
          });
          navigate('/account');
          return;
        }

        // Verify state matches what we stored
        const storedState = localStorage.getItem('twitter_oauth_state');
        if (state !== storedState) {
          console.error('State mismatch in Twitter callback');
          toast({
            title: "Security Error",
            description: "Twitter authentication state mismatch. Please try again.",
            variant: "destructive",
          });
          navigate('/account');
          return;
        }

        // Wait a bit for auth to be ready, then check again
        if (!user) {
          console.log('No user found initially, waiting for auth...');
          // Wait for auth to be available
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!user) {
            console.error('No user found during Twitter callback after waiting');
            toast({
              title: "Authentication Required",
              description: "Please sign in first before linking your Twitter account.",
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }
        }

        console.log('User found, proceeding with Twitter linking for user:', user?.id);

        // Process the Twitter linking
        const { data, error: linkError } = await linkTwitterAccount({ code, state });

        if (linkError || !data?.success) {
          console.error('Failed to link Twitter account:', linkError);
          toast({
            title: "Linking Failed",
            description: "Failed to link your Twitter account. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success!",
            description: "Your Twitter account has been linked successfully.",
          });
        }

        // Clean up stored state
        localStorage.removeItem('twitter_oauth_state');
        
        // Navigate back to account page
        navigate('/account');

      } catch (error) {
        console.error('Error processing Twitter callback:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        navigate('/account');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, user, linkTwitterAccount, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <h2 className="text-xl font-semibold">Linking Twitter Account...</h2>
          <p className="text-muted-foreground">Please wait while we complete the process.</p>
        </div>
      </div>
    );
  }

  return null;
}