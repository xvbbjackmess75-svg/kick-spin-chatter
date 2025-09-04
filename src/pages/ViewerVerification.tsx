import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useKickAccount } from '@/hooks/useKickAccount';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Users,
  ArrowRight,
  Star,
  ExternalLink
} from 'lucide-react';
import { LinkKickAccount } from '@/components/LinkKickAccount';

export default function ViewerVerification() {
  const [discordLinked, setDiscordLinked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { isKickLinked } = useKickAccount();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isVerified = role === 'verified_viewer';
  const canGetVerified = isKickLinked && discordLinked;

  useEffect(() => {
    // Check if Discord is already linked (you can implement this based on your Discord integration)
    checkDiscordStatus();
  }, [user]);

  const checkDiscordStatus = async () => {
    if (!user) return;
    
    try {
      // This would check your Discord integration
      // For now, we'll simulate it with localStorage
      const discordStatus = localStorage.getItem(`discord_linked_${user.id}`);
      setDiscordLinked(!!discordStatus);
    } catch (error) {
      console.error('Error checking Discord status:', error);
    }
  };

  const handleLinkDiscord = async () => {
    setLoading(true);
    
    try {
      // Simulate Discord OAuth flow
      // In a real implementation, you'd redirect to Discord OAuth
      toast({
        title: "Discord Integration",
        description: "Discord linking would redirect to Discord OAuth here",
      });
      
      // For demo purposes, mark as linked
      if (user) {
        localStorage.setItem(`discord_linked_${user.id}`, 'true');
        setDiscordLinked(true);
        
        toast({
          title: "Discord Linked!",
          description: "Your Discord account has been successfully linked",
        });
      }
    } catch (error) {
      toast({
        title: "Discord Linking Failed",
        description: "Failed to link Discord account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetVerified = async () => {
    if (!canGetVerified || !user) return;
    
    setLoading(true);
    
    try {
      // Direct insert since user should only get verified_viewer role through this flow
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'verified_viewer'
        });

      if (error) throw error;

      toast({
        title: "🎉 Verification Complete!",
        description: "You are now a verified viewer with exclusive benefits!",
      });

      // Redirect to dashboard or verification success page
      setTimeout(() => {
        navigate('/?verified=true');
      }, 2000);

    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to complete verification process",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="gaming-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to access verification
            </p>
            <Button onClick={() => navigate('/viewer-registration')}>
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-kick-green" />
            <h1 className="text-3xl font-bold text-foreground">Viewer Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Complete the verification process to unlock exclusive benefits
          </p>
        </div>

        {/* Current Status */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge 
                variant={isVerified ? "default" : "secondary"}
                className={isVerified ? "bg-green-500" : ""}
              >
                {roleLoading ? 'Loading...' : role || 'viewer'}
              </Badge>
              {isVerified && (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Kick Account Linking */}
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Link Kick Account
                {isKickLinked && <CheckCircle className="h-4 w-4 text-green-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinkKickAccount />
            </CardContent>
          </Card>

          {/* Discord Account Linking */}
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Link Discord Account
                {discordLinked && <CheckCircle className="h-4 w-4 text-green-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discordLinked ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded border border-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Discord Account Linked
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        Your Discord account is successfully connected
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Link your Discord account to complete verification and prevent alt accounts.
                  </p>
                  <Button 
                    onClick={handleLinkDiscord}
                    disabled={loading}
                    className="w-full"
                    variant="outline"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {loading ? 'Linking...' : 'Link Discord Account'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Verification Action */}
        {canGetVerified && !isVerified && (
          <Card className="gaming-card border-green-500/50">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ready for Verification!</h3>
              <p className="text-muted-foreground mb-6">
                Both your Kick and Discord accounts are linked. Complete verification to unlock benefits.
              </p>
              <Button 
                onClick={handleGetVerified}
                disabled={loading}
                className="gaming-button"
                size="lg"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                {loading ? 'Verifying...' : 'Complete Verification'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Verification Benefits */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle>Verification Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-500">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Badge
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Show your status in giveaways
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500">
                  <Star className="h-3 w-3 mr-1" />
                  Extra Chances
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Increased giveaway odds
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-500">
                  <Users className="h-3 w-3 mr-1" />
                  Trusted Status
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Access to exclusive events
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
          {isVerified && (
            <Button 
              onClick={() => navigate('/giveaways')}
              className="gaming-button"
            >
              Browse Giveaways
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}