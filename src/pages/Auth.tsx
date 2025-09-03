import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  UserPlus, 
  Bot, 
  Zap, 
  Crown,
  Github
} from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithKick, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, { 
          full_name: displayName || email.split('@')[0] 
        });
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: isSignUp 
            ? "Account created! Please check your email to verify your account." 
            : "Welcome back!",
        });
        if (!isSignUp) {
          navigate('/');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKickAuth = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithKick();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect with Kick",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">KickBot</h1>
          </div>
          <p className="text-muted-foreground">
            {isSignUp ? 'Create your account to get started' : 'Welcome back! Sign in to your account'}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kick OAuth Button */}
            <Button 
              onClick={handleKickAuth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-kick-green to-kick-purple text-white font-semibold py-3 hover:opacity-90 transition-opacity"
            >
              <Github className="h-5 w-5 mr-2" />
              Continue with GitHub
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary/30"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/30"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/30"
                  required
                />
              </div>
              
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary/30"
                    required
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full gaming-button" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    {isSignUp ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Toggle Mode */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary ml-1 p-0 h-auto font-semibold"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Button>
          </p>
        </div>

        {/* Features */}
        <Card className="gaming-card border-border/30">
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Crown className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Manage chat commands & giveaways</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-kick-green" />
                <span className="text-muted-foreground">Real-time chat monitoring</span>
              </div>
              <div className="flex items-center gap-3">
                <Bot className="h-4 w-4 text-kick-purple" />
                <span className="text-muted-foreground">Advanced bot configuration</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}