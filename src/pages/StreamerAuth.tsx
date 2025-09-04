import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Mail, Lock, Crown, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

export default function StreamerAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { role } = useUserRole();

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
      // Check if user is a streamer after sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_streamer')
          .eq('user_id', user.id)
          .single();
          
        if (!profile?.is_streamer) {
          toast({
            title: "Access Denied",
            description: "This login is for streamers only. Please use the viewer login or upgrade your account.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }
      }
      navigate('/');
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
      // After successful signup, create streamer profile but don't set is_streamer yet
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            display_name: email.split('@')[0],
            is_streamer: false // Start as regular user, needs admin approval
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      toast({
        title: "Account created!",
        description: "Your account needs admin approval to become a streamer. Please contact an admin."
      });
      
      // Redirect to upgrade page
      navigate('/streamer-upgrade-request');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-kick-green" />
            <h1 className="text-2xl font-bold text-foreground">Streamer Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Access your streaming tools and manage your community
          </p>
        </div>

        <Card className="gaming-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center gap-2 justify-center">
              <Crown className="h-5 w-5" />
              Streamer Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Apply</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Streamer Sign In</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your streamer credentials
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
                    {loading ? 'Signing in...' : 'Sign In as Streamer'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Apply for Streamer Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Create account and request streamer approval
                  </p>
                </div>
                
                <div className="text-xs text-muted-foreground bg-orange-500/10 p-3 rounded border border-orange-500/20 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-orange-400">Admin Approval Required</span>
                  </div>
                  <div>Your account will be created as a regular user. Contact an admin to upgrade to streamer status.</div>
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
                  
                  <Button type="submit" disabled={loading} className="gaming-button w-full">
                    {loading ? 'Creating account...' : 'Apply for Streamer Access'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                onClick={() => navigate('/viewer-benefits')}
                variant="outline" 
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                I'm a Viewer
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Looking for viewer verification instead?
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}