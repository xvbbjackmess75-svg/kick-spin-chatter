import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Crown, AlertCircle, Clock, CheckCircle, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function StreamerUpgradeRequest() {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      // Update profile with streamer request
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: `${user.email?.split('@')[0]} (Pending Streamer Approval)`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Streamer request submitted!",
        description: "An admin will review your request and approve your streamer status."
      });

      // Could redirect to a pending status page or dashboard
      navigate('/');
      
    } catch (error) {
      console.error('Error submitting streamer request:', error);
      toast({
        title: "Request failed",
        description: "Failed to submit your streamer request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="gaming-card max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">You need to be logged in to request streamer access.</p>
            <Button onClick={() => navigate('/streamer-auth')} className="gaming-button">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-kick-green" />
            <h1 className="text-2xl font-bold text-foreground">Upgrade to Streamer</h1>
          </div>
          <p className="text-muted-foreground">
            Request admin approval to unlock streaming features
          </p>
        </div>

        <Card className="gaming-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center gap-2 justify-center">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Admin Approval
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your account has been created but needs admin approval for streamer access
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Info */}
            <div className="text-sm text-muted-foreground bg-orange-500/10 p-4 rounded border border-orange-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="font-semibold text-orange-400">Admin Approval Required</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Account created successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Waiting for admin approval</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <Crown className="h-4 w-4" />
                  <span>Streamer access (pending)</span>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary mt-0.5">1</div>
                  <div>
                    <div className="font-medium">Contact an Admin</div>
                    <div className="text-sm text-muted-foreground">Reach out to a platform admin to review your request</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary mt-0.5">2</div>
                  <div>
                    <div className="font-medium">Admin Review</div>
                    <div className="text-sm text-muted-foreground">Admin will verify your identity and streaming credentials</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary mt-0.5">3</div>
                  <div>
                    <div className="font-medium">Streamer Access Granted</div>
                    <div className="text-sm text-muted-foreground">Your account will be upgraded with full streaming features</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional message to admin */}
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  Message to Admin (Optional)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Tell us about your streaming experience, why you need streamer access, or any other relevant information..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-secondary/30 min-h-[100px]"
                />
              </div>
              
              <Button type="submit" disabled={loading} className="gaming-button w-full">
                {loading ? 'Submitting...' : 'Submit Request to Admin'}
              </Button>
            </form>

            <div className="pt-4 border-t border-border space-y-3">
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline" 
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Use Viewer Features Instead
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue to Dashboard
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                You can still use basic features while waiting for approval
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}