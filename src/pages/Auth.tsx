import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Mail, Lock, User, Crown, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in but missing profile data
  const checkAndFixIncompleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        console.log('⚠️ User authenticated but missing profile, signing out...');
        toast({
          title: "Account Data Missing",
          description: "Please create a new account to continue.",
          variant: "default"
        });
        await supabase.auth.signOut();
        window.location.reload();
      }
    }
  };

  // Run check on component mount
  React.useEffect(() => {
    checkAndFixIncompleteAccount();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Since this is the VIEWER auth page, ensure user gets viewer-only access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user is marked as a streamer in profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_streamer')
          .eq('user_id', user.id)
          .single();
          
        if (profile?.is_streamer) {
          toast({
            title: "Redirecting to Streamer Portal",
            description: "Use the streamer login for full access to streaming features.",
            variant: "default"
          });
          await supabase.auth.signOut();
          navigate('/streamer-auth');
          setLoading(false);
          return;
        }
        
        // CRITICAL: Since this is viewer login, reset roles to ONLY viewer
        // Remove any higher-level roles that might grant streamer access
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .in('role', ['user', 'premium', 'vip_plus']);

        // Ensure viewer role exists
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'viewer'
          });

        if (roleError) {
          console.error('Error ensuring viewer role:', roleError);
        }
        
        // Force a page reload to ensure role state is fresh
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        navigate('/');
      }
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // After successful signup, create viewer profile and assign ONLY viewer role
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // First, create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            display_name: email.split('@')[0],
            is_streamer: false
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Remove any existing roles that might have been auto-assigned
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id);

        // Then, assign ONLY the viewer role (not user role)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'viewer'
          });

        if (roleError) {
          console.error('Error assigning viewer role:', roleError);
        }
      }

      toast({
        title: "Viewer account created!",
        description: "You can now sign in and access viewer features."
      });
      // Auto-switch to sign in tab after successful signup
      setTimeout(() => {
        const signInTab = document.querySelector('[value="signin"]') as HTMLElement;
        signInTab?.click();
      }, 1000);
    }
    
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-kick-green" />
            <h1 className="text-2xl font-bold text-foreground">Viewer Login</h1>
          </div>
          <p className="text-muted-foreground">
            Access viewer features and verification
          </p>
        </div>

        <Card className="gaming-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center gap-2 justify-center">
              <Users className="h-5 w-5" />
              Viewer Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Viewer Sign In</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your viewer credentials
                  </p>
                </div>
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-secondary/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-secondary/30"
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading} className="gaming-button w-full">
                    {loading ? 'Signing in...' : 'Sign In as Viewer'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Create Viewer Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Join as a viewer - get verification benefits!
                  </p>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-secondary/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-secondary/30"
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-primary/10 p-3 rounded border border-primary/20">
                    <div className="font-semibold mb-1">Viewer Benefits:</div>
                    <div className="space-y-1">
                      <div>• Get verified status with Kick + Discord links</div>
                      <div>• Extra chances in verified giveaways</div>
                      <div>• Trust badges and community status</div>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="gaming-button w-full">
                    {loading ? 'Creating account...' : 'Create Viewer Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                onClick={() => navigate('/streamer-auth')}
                variant="outline" 
                className="w-full"
              >
                <Crown className="h-4 w-4 mr-2" />
                I'm a Streamer
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Access full streamer features and tools
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}