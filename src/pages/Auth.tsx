import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Mail, Lock, User } from 'lucide-react';

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
        description: "You can now sign in and link your Kick account from the Account page."
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
    localStorage.setItem('guest_mode', 'true');
    toast({
      title: "Guest Mode",
      description: "You're now accessing the dashboard as a guest.",
      variant: "default"
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-kick-green" />
            <h1 className="text-2xl font-bold text-foreground">StreamBot</h1>
          </div>
          <p className="text-muted-foreground">
            Sign in to manage your Kick.com giveaways and chatbot
          </p>
        </div>

        <Card className="gaming-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Sign In</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your credentials to access your account
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
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Create Account</h3>
                  <p className="text-sm text-muted-foreground">
                    No email confirmation required - start using immediately!
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
                  
                  <div className="text-xs text-muted-foreground bg-primary/10 p-2 rounded border border-primary/20">
                    💡 After creating your account, you can link your Kick.com profile from the Account page
                  </div>
                  
                  <Button type="submit" disabled={loading} className="gaming-button w-full">
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                onClick={handleContinueAsGuest}
                variant="outline" 
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                Continue as Guest
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Explore the interface without creating an account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}