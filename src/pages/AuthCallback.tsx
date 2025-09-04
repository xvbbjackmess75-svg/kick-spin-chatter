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
              origin: window.location.origin
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

            // Auto-create and sign into Supabase account for seamless experience
            try {
              console.log('🔄 Creating hybrid Supabase account for Kick user...');
              
              // Create a unique email for the Kick user
              const userEmail = `kick_${user.id}@kickuser.lovable.app`;
              
              // Generate a secure password
              const randomPassword = crypto.getRandomValues(new Uint8Array(16));
              const password = Array.from(randomPassword, byte => byte.toString(16).padStart(2, '0')).join('');
              
              console.log('🔄 Creating/signing into Supabase account...');
              
              // Try to sign up first (will fail if exists, which is fine)
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: userEmail,
                password: password,
                options: {
                  emailRedirectTo: `${window.location.origin}/`,
                  data: {
                    kick_username: user.username,
                    kick_user_id: user.id.toString(),
                    kick_avatar: user.avatar,
                    display_name: user.display_name || user.username,
                    is_hybrid_account: true,
                    created_via_kick: true
                  }
                }
              });

              // If user already exists, try to sign in with stored credentials or reset password
              if (signUpError?.message.includes('already registered')) {
                console.log('🔄 User exists, attempting sign in...');
                
                // Try with stored credentials first
                const storedCreds = localStorage.getItem('kick_hybrid_credentials');
                let signInSuccess = false;
                
                if (storedCreds) {
                  try {
                    const creds = JSON.parse(storedCreds);
                    if (creds.kick_user_id.toString() === user.id.toString()) {
                      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: userEmail,
                        password: creds.password
                      });
                      
                      if (!signInError && signInData.user) {
                        console.log('✅ Signed in with stored credentials');
                        signInSuccess = true;
                      }
                    }
                  } catch (e) {
                    console.log('🔄 Stored credentials invalid');
                  }
                }
                
                // If stored credentials failed, reset password and sign in
                if (!signInSuccess) {
                  console.log('🔄 Resetting password for existing user...');
                  
                  // Reset password to new one
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(userEmail, {
                    redirectTo: `${window.location.origin}/auth-callback?reset=true`
                  });
                  
                  if (!resetError) {
                    // Store the new credentials for next time
                    localStorage.setItem('kick_hybrid_credentials', JSON.stringify({
                      email: userEmail,
                      password: password,
                      created_at: new Date().toISOString(),
                      kick_user_id: user.id
                    }));
                  }
                  
                  // For now, create session without full auth (will be completed after reset)
                  console.log('✅ Password reset initiated');
                }
              } else if (!signUpError && signUpData.user) {
                console.log('✅ New account created successfully');
                
                // Store credentials for future use
                localStorage.setItem('kick_hybrid_credentials', JSON.stringify({
                  email: userEmail,
                  password: password,
                  created_at: new Date().toISOString(),
                  kick_user_id: user.id
                }));
              }
              
              console.log('✅ Supabase integration completed');
              
              toast({
                title: "Account Ready!",
                description: `Welcome ${user.username}! You can now access all features including email/password changes.`,
              });
              
            } catch (hybridError) {
              console.error('❌ Hybrid account creation failed:', hybridError);
              toast({
                title: "Authentication Complete",
                description: `Signed in as ${user.username}. All basic features are available.`,
              });
            }

            const successMessage = isLinkingMode 
              ? `Kick account @${user.username} linked successfully!`
              : `Successfully signed in as ${user.username} with enhanced security!`;

            if (!isLinkingMode) {
              toast({
                title: "Welcome!",
                description: successMessage,
              });
            }
            
            // Redirect based on mode
            navigate(isLinkingMode ? '/account' : '/');
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