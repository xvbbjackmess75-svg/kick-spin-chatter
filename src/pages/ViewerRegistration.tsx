import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';

export default function ViewerRegistration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleViewerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // After successful signup, assign viewer role
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // The user role should be automatically assigned by the trigger
        // But let's also create a profile entry
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
      }

      toast({
        title: "Registration successful!",
        description: "Your viewer account has been created. Now let's get you verified!",
      });

      // Redirect to verification page
      navigate('/viewer-verification');
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-kick-green" />
            <h1 className="text-2xl font-bold text-foreground">Viewer Registration</h1>
          </div>
          <p className="text-muted-foreground">
            Create your account to start the verification process
          </p>
        </div>

        <Card className="gaming-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center gap-2 justify-center">
              <UserPlus className="h-5 w-5" />
              Create Viewer Account
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Step 1 of 3: Account creation
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleViewerSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
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
                <div className="font-semibold mb-1">What happens next:</div>
                <div className="space-y-1">
                  <div>• You'll get the "Viewer" role initially</div>
                  <div>• Link your Kick account (required)</div>
                  <div>• Link your Discord account (required)</div>
                  <div>• Get "Verified Viewer" status and benefits</div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className="gaming-button w-full"
              >
                {loading ? 'Creating account...' : 'Create Account & Continue'}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                onClick={() => navigate('/viewer-benefits')}
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Benefits
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary"
              onClick={() => navigate('/auth')}
            >
              Sign in here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}