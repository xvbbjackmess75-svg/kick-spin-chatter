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
      // Check if user has streamer panel access based on role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRoleData } = await supabase
          .rpc('get_user_role', { _user_id: user.id });
          
        const userRole = userRoleData || 'user';
        
        // Allow access for streamers, users, premium, vip_plus, and admin roles
        if (!['streamer', 'user', 'premium', 'vip_plus', 'admin'].includes(userRole)) {
          toast({
            title: "Access Denied", 
            description: "This portal is for streamers. Please use the viewer portal.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }
      }
      navigate('/dashboard');
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
      // After successful signup, create profile and assign premium role for streamer access
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create/update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            display_name: email.split('@')[0],
            is_streamer: true
          });

        // Assign streamer role for streamer panel access (remove default viewer role first)
        const { error: deleteViewerRoleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', 'viewer');

        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'streamer'
          });

        if (profileError || roleError || deleteViewerRoleError) {
          console.error('Error creating profile or role:', { profileError, roleError, deleteViewerRoleError });
        }
      }

      toast({
        title: "Streamer account created!",
        description: "Welcome! You now have access to all streaming features."
      });
      
      navigate('/dashboard');
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
                  <h3 className="text-lg font-semibold text-foreground">Create Streamer Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant access to all streaming features
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
                  
                  <Button type="submit" disabled={loading} className="gaming-button w-full">
                    {loading ? 'Creating account...' : 'Create Streamer Account'}
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