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
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      
      // Check if this is account linking mode
      const isLinkingMode = sessionStorage.getItem('kick_linking_mode') === 'true';
      sessionStorage.removeItem('kick_linking_mode'); // Clean up

      if (error) {
        toast({
          title: "Authentication failed",
          description: error,
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      if (code) {
        try {
          console.log('🔄 Callback Debug - Code received:', code.substring(0, 10) + '...')
          console.log('🔄 Callback Debug - State received:', state)
          
          // Get stored code verifier
          const codeVerifier = sessionStorage.getItem('kick_code_verifier');
          console.log('🔄 Callback Debug - Code verifier from storage:', codeVerifier ? codeVerifier.substring(0, 10) + '...' : 'NOT FOUND')
          sessionStorage.removeItem('kick_code_verifier'); // Clean up
          
          if (!codeVerifier) {
            console.error('❌ No code verifier found in sessionStorage')
            console.error('❌ SessionStorage contents:', Object.keys(sessionStorage))
            throw new Error('No code verifier found. Please try logging in again.')
          }
          
          console.log('🔄 Calling exchange function...')
          
          // Exchange the code for tokens via our edge function
          const response = await supabase.functions.invoke('kick-oauth', {
            body: { 
              action: 'exchange',
              code: code,
              state: state,
              code_verifier: codeVerifier,
              origin: 'https://kickhelper.app'
            }
          });

          console.log('🔄 Exchange response:', response)
          console.log('🔄 Exchange response data:', response.data)
          console.log('🔄 Exchange response error:', response.error)

          if (response.error) {
            console.error('❌ Exchange failed with error:', response.error)
            console.error('❌ Full error object:', JSON.stringify(response.error, null, 2))
            throw new Error(`OAuth exchange failed: ${JSON.stringify(response.error)}`)
          }

          if (response.data?.error) {
            console.error('❌ Exchange failed with data error:', response.data.error)
            console.error('❌ Full data error:', JSON.stringify(response.data, null, 2))
            throw new Error(`OAuth exchange failed: ${response.data.error}`)
          }

          const { success, user, token_info, message } = response.data;
          
          console.log('🔍 DEBUG: Full response data:', JSON.stringify(response.data, null, 2));
          console.log('🔍 DEBUG: User object:', JSON.stringify(user, null, 2));

          if (success && user) {
            console.log('🔍 DEBUG: About to store user data:', {
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              avatar: user.avatar
            });
            
            // Store Kick user info in localStorage
            localStorage.setItem('kick_user', JSON.stringify({
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              avatar: user.avatar,
              authenticated: true,
              provider: 'kick'
            }));

            if (token_info) {
              // Store token info if available (optional)
              localStorage.setItem('kick_token', JSON.stringify(token_info));
            }

            // Check if user is logged in and wants to link account
            const currentUser = (await supabase.auth.getUser()).data.user;
            
            if (currentUser && isLinkingMode) {
              console.log('🔗 Linking Kick account to existing user:', currentUser.id);
              
              try {
                // Link Kick account to existing profile
                const { error: linkError } = await supabase.rpc('link_kick_account_to_profile', {
                  profile_user_id: currentUser.id,
                  kick_user_id: user.id.toString(),
                  kick_username: user.username,
                  kick_avatar: user.avatar
                });

                if (linkError) {
                  console.error('❌ Failed to link Kick account:', linkError);
                  console.error('❌ Link error details:', JSON.stringify(linkError, null, 2));
                  throw linkError;
                }

                console.log('✅ Kick account linked successfully');
                
                // Store Kick user info in localStorage for immediate use
                localStorage.setItem('kick_user', JSON.stringify({
                  id: user.id,
                  username: user.username,
                  display_name: user.display_name,
                  avatar: user.avatar,
                  authenticated: true,
                  provider: 'kick'
                }));

                if (token_info) {
                  localStorage.setItem('kick_token', JSON.stringify(token_info));
                }
                
                toast({
                  title: "Account Linked!",
                  description: `Kick account @${user.username} linked successfully!`,
                });

                navigate('/account');
                return;
                
              } catch (linkError) {
                console.error('❌ Account linking failed:', linkError);
                toast({
                  title: "Linking Failed", 
                  description: "Failed to link Kick account. Please try again.",
                  variant: "destructive"
                });
                navigate('/account');
                return;
              }
            }

            // If no user is logged in, cannot link Kick account - redirect to login
            console.log('❌ No user logged in - cannot link Kick account for verification');
            toast({
              title: "Login Required",
              description: "Please log in first before linking your Kick account for verification.",
              variant: "destructive"
            });
            navigate('/auth');
          } else {
            throw new Error('OAuth exchange failed - no user data received');
          }
        } catch (error) {
          console.error('OAuth exchange error:', error);
          toast({
            title: "Authentication failed",
            description: "Failed to complete authentication. Please try again.",
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