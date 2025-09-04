import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function KickOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get Kick user data
  const kickUserData = localStorage.getItem('kick_user');
  const kickUser = kickUserData ? JSON.parse(kickUserData) : null;

  if (!kickUser) {
    navigate('/auth');
    return null;
  }

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create Supabase account
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            kick_username: kickUser.username,
            kick_user_id: kickUser.id.toString(),
            kick_avatar: kickUser.avatar,
            display_name: kickUser.display_name || kickUser.username,
            is_hybrid_account: true
          }
        }
      });
      
      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });

      // Mark onboarding as completed
      localStorage.setItem('kick_onboarding_completed', 'true');

      // Navigate to dashboard
      navigate('/');
      
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark onboarding as completed
    localStorage.setItem('kick_onboarding_completed', 'true');
    
    toast({
      title: "Setup skipped",
      description: "You can add email and password later in Account Settings.",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome, {kickUser.username}!</h1>
          <p className="text-muted-foreground">
            Complete your account setup to access all features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Add Email & Password
            </CardTitle>
            <CardDescription>
              This allows you to sign in from any device and manage your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompleteSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                  placeholder="Create a password"
                  minLength={6}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !email || !password || password !== confirmPassword}
                  className="flex-1"
                >
                  {loading ? "Creating Account..." : (
                    <>
                      Complete Setup
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can always add email and password later in Account Settings
          </p>
        </div>
      </div>
    </div>
  );
}