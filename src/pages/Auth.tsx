import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      toast({
        title: "Account created!",
        description: "You can now sign in and link your Kick account."
      });
      // Auto-switch to sign in tab after successful signup
      setTimeout(() => {
        const signInTab = document.querySelector('[value="signin"]') as HTMLElement;
        signInTab?.click();
      }, 1000);
    }
    
    setLoading(false);
  };

  const handleContinueAsGuest = () => {
    // Set a guest flag in localStorage
    localStorage.setItem('guest_mode', 'true');
    toast({
      title: "Guest Mode",
      description: "You're now accessing the dashboard as a guest.",
      variant: "default"
    });
    navigate('/');
  };

  const handleKickOAuth = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting Kick OAuth flow...');
      
      const response = await supabase.functions.invoke('kick-oauth', {
        body: { 
          action: 'authorize',
          origin: window.location.origin
        }
      });

      console.log('📥 OAuth response:', response);

      if (response.error) {
        console.error('❌ OAuth response error:', response.error);
        throw response.error;
      }

      const { authUrl, codeVerifier } = response.data;
      console.log('🔗 Auth URL received:', authUrl);
      
      if (authUrl) {
        // Store code verifier for later use
        sessionStorage.setItem('kick_code_verifier', codeVerifier);
        console.log('🚀 Redirecting to:', authUrl);
        window.location.href = authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Kick OAuth error:', error);
      toast({
        title: "Authentication failed",
        description: "Failed to start Kick authentication. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="gaming-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-kick-green" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KickBot
            </h1>
          </div>
          <CardTitle className="text-xl text-foreground">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in with your Kick account to automatically access all chatbot features.
          </p>
        </CardHeader>
        <CardContent>
          {/* Sign in with Kick Button */}
          <Button 
            type="button"
            className="w-full gaming-button mb-4"
            onClick={handleKickOAuth}
            disabled={loading}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-kick-green" />
              {loading ? "Connecting..." : "Sign in with Kick (Recommended)"}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>

          {/* Continue as Guest Button */}
          <Button 
            type="button"
            variant="ghost"
            className="w-full mb-6"
            onClick={handleContinueAsGuest}
          >
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Continue as Guest
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or create manual account</span>
            </div>
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signup">Create Account</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>
            <div className="mb-4 p-3 bg-kick-green/10 border border-kick-green/20 rounded-lg">
              <p className="text-sm text-center">
                <strong className="text-kick-green">Kick users:</strong> Sign in with Kick above for instant access to all features - no additional setup required!
              </p>
            </div>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" variant="outline" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email (no confirmation required)</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" variant="outline" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}