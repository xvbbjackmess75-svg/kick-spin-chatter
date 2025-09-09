import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useKickAccount } from "@/hooks/useKickAccount";
import { useDiscordAccount } from "@/hooks/useDiscordAccount";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { 
  Trophy,
  Shield,
  Star,
  ArrowRight,
  Users,
  Gift,
  ExternalLink,
  CheckCircle,
  Link,
  MessageSquare,
  Crown,
  Zap
} from "lucide-react";

export default function ViewerDashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { role } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isKickLinked } = useKickAccount();
  const { isDiscordLinked, discordUser } = useDiscordAccount();
  const [linkingDiscord, setLinkingDiscord] = useState(false);

  const handleDiscordLink = async () => {
    setLinkingDiscord(true);
    
    try {
      // Generate a random state for security
      const state = crypto.randomUUID();
      localStorage.setItem('discord_oauth_state', state);
      
      // Call our edge function to get the Discord OAuth URL
      const { data, error } = await supabase.functions.invoke('discord-oauth', {
        body: {
          action: 'authorize',
          state: state
        }
      });

      if (error) throw error;

      // Redirect to Discord OAuth
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Discord OAuth initiation error:', error);
      toast({
        title: "Discord Link Failed",
        description: "Failed to initiate Discord authentication. Please try again.",
        variant: "destructive"
      });
      setLinkingDiscord(false);
    }
  };

  const viewerBenefits = [
    {
      icon: Trophy,
      title: "Bonus Hunt Access",
      description: "Track your gambling sessions and manage your bonus hunts",
      available: true,
      path: "/bonus-hunt"
    },
    {
      icon: Shield,
      title: "Verified Status",
      description: "Link Kick + Discord for verified viewer badge",
      available: isKickLinked ? "partial" : false,
      action: isKickLinked ? "Link Discord" : "Link Kick Account"
    },
    {
      icon: Gift,
      title: "Giveaway Benefits",
      description: "Extra chances in verified-only giveaways",
      available: isKickLinked ? true : false
    },
    {
      icon: Star,
      title: "Community Trust",
      description: "Build reputation with streamers and viewers",
      available: isKickLinked ? true : false
    }
  ];

  const accountStatus = {
    kickLinked: isKickLinked,
    discordLinked: isDiscordLinked,
    verified: isKickLinked && isDiscordLinked
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-primary/10 rounded-xl border border-primary/20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-12 w-12 text-kick-green" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Viewer Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6">
            Welcome to your viewer experience! Get verified, enjoy bonus hunts, and earn extra chances in giveaways.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge variant="outline" className="text-muted-foreground">
              Current Role: {role || 'viewer'}
            </Badge>
            {accountStatus.verified && (
              <Badge className="bg-kick-green text-primary-foreground">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="gaming-button" size="lg" onClick={() => navigate("/bonus-hunt")}>
              <Trophy className="h-5 w-5 mr-2" />
              Start Bonus Hunting
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            {!accountStatus.verified && (
              <Button variant="outline" size="lg" onClick={() => navigate("/viewer-verification")}>
                <Shield className="h-5 w-5 mr-2" />
                Get Verified
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-kick-green" />
            Account Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Kick Account Status */}
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className={`h-5 w-5 ${accountStatus.kickLinked ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Kick Account</p>
                  <p className="text-sm text-muted-foreground">
                    {accountStatus.kickLinked ? `Linked: ${profile?.kick_username}` : 'Not linked'}
                  </p>
                </div>
              </div>
              {accountStatus.kickLinked ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Button size="sm" onClick={() => navigate('/account')}>
                  <Link className="h-4 w-4 mr-1" />
                  Link
                </Button>
              )}
            </div>

            {/* Discord Account Status */}
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className={`h-5 w-5 ${accountStatus.discordLinked ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Discord Account</p>
                  <p className="text-sm text-muted-foreground">
                    {accountStatus.discordLinked ? `Linked: ${discordUser?.username}` : 'Not linked'}
                  </p>
                </div>
              </div>
              {accountStatus.discordLinked ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleDiscordLink}
                  disabled={linkingDiscord}
                >
                  <Link className="h-4 w-4 mr-1" />
                  {linkingDiscord ? 'Linking...' : 'Link'}
                </Button>
              )}
            </div>
          </div>

          {accountStatus.kickLinked && !accountStatus.discordLinked && (
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-orange-400">Almost Verified!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Link your Discord account to complete verification and unlock all viewer benefits.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Viewer Benefits */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">Your Viewer Benefits</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {viewerBenefits.map((benefit, index) => (
            <Card 
              key={index} 
              className={`gaming-card transition-all duration-200 ${
                benefit.available === true 
                  ? 'hover:scale-[1.02] cursor-pointer' 
                  : benefit.available === 'partial'
                  ? 'border-orange-500/50'
                  : 'opacity-60'
              }`}
              onClick={benefit.path && benefit.available === true ? () => navigate(benefit.path!) : undefined}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    benefit.available === true 
                      ? 'bg-kick-green/10' 
                      : benefit.available === 'partial'
                      ? 'bg-orange-500/10'
                      : 'bg-muted/50'
                  }`}>
                    <benefit.icon className={`h-6 w-6 ${
                      benefit.available === true 
                        ? 'text-kick-green' 
                        : benefit.available === 'partial'
                        ? 'text-orange-500'
                        : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      {benefit.available === true && (
                        <Badge variant="outline" className="text-xs text-kick-green border-kick-green/50">
                          Available
                        </Badge>
                      )}
                      {benefit.available === 'partial' && (
                        <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/50">
                          Partial
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{benefit.description}</p>
                    
                    {benefit.action && benefit.available !== true && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (benefit.action === "Link Discord") {
                            handleDiscordLink();
                          } else {
                            navigate('/account');
                          }
                        }}
                      >
                        {benefit.action}
                      </Button>
                    )}
                  </div>
                </div>
                {benefit.path && benefit.available === true && (
                  <div className="mt-4 flex items-center text-sm text-primary hover:text-primary/80 transition-colors">
                    Access now <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upgrade Option */}
      <Card className="gaming-card border-primary/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Want More Features?</h3>
                <p className="text-muted-foreground text-sm">
                  Upgrade to a streamer account for giveaways, chat commands, and more.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/upgrade-to-streamer')}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Account
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}