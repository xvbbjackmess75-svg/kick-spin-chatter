import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { 
  Crown,
  Users, 
  Gift,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  ArrowLeft,
  Zap,
  MessageSquare,
  Bot
} from 'lucide-react';

const streamerBenefits = [
  {
    icon: MessageSquare,
    title: "Custom Chat Commands",
    description: "Create unlimited custom commands with cooldowns and permissions",
    color: "text-blue-500"
  },
  {
    icon: Gift,
    title: "Advanced Giveaways",
    description: "Run sophisticated giveaways with verification controls and bonus chances",
    color: "text-purple-500"
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track viewer engagement, command usage, and stream performance",
    color: "text-green-500"
  },
  {
    icon: Bot,
    title: "AI-Powered Chatbot",
    description: "Intelligent bot responses and automated moderation tools",
    color: "text-orange-500"
  },
  {
    icon: Shield,
    title: "Verification Controls",
    description: "Set verification requirements and prevent alt accounts in events",
    color: "text-red-500"
  },
  {
    icon: Users,
    title: "Community Management",
    description: "Advanced tools to manage your growing community effectively",
    color: "text-cyan-500"
  }
];

const upgradeSteps = [
  {
    step: 1,
    title: "Confirm Your Identity",
    description: "Verify you have a Kick channel to stream on",
    icon: Shield
  },
  {
    step: 2,
    title: "Link Your Channel",
    description: "Connect your Kick streaming channel",
    icon: MessageSquare
  },
  {
    step: 3,
    title: "Get Streamer Access",
    description: "Unlock all streamer features and tools",
    icon: Crown
  }
];

export default function UpgradeToStreamer() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { role } = useUserRole();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAlreadyStreamer = profile?.is_streamer || role === 'admin';
  const hasKickLinked = profile?.kick_username && profile?.kick_user_id;

  const handleUpgradeToStreamer = async () => {
    if (!user || !hasKickLinked) {
      toast({
        title: "Kick Account Required",
        description: "Please link your Kick account first to upgrade to streamer",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Update profile to mark as streamer
      const { error } = await updateProfile({
        is_streamer: true
      });

      if (error) throw error;

      toast({
        title: "🎉 Upgrade Successful!",
        description: "You now have access to all streamer features!",
      });

      // Redirect to dashboard after successful upgrade
      setTimeout(() => {
        navigate('/?upgraded=true');
      }, 2000);

    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: "Failed to upgrade to streamer account. Please try again.",
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
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to upgrade to streamer
            </p>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadyStreamer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="gaming-card max-w-md">
          <CardContent className="p-6 text-center">
            <Crown className="h-12 w-12 text-kick-green mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Already a Streamer!</h2>
            <p className="text-muted-foreground mb-4">
              You already have streamer privileges and access to all features.
            </p>
            <Button onClick={() => navigate('/')} className="gaming-button">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-gaming opacity-20" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Crown className="h-12 w-12 text-kick-green" />
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Upgrade to Streamer
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Unlock
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Creator Power</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your viewer account into a full streamer account and access powerful tools 
            to grow your community, run engaging events, and manage your Kick channel like a pro.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge variant="outline" className="text-muted-foreground">
              Current: {role || 'viewer'}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge className="bg-kick-green text-primary-foreground">
              <Crown className="h-3 w-3 mr-1" />
              Streamer
            </Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {hasKickLinked ? (
              <Button 
                size="lg" 
                className="gaming-button text-lg px-8 py-6"
                onClick={handleUpgradeToStreamer}
                disabled={loading}
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                {loading ? 'Upgrading...' : 'Upgrade Now'}
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-border/50"
                onClick={() => navigate('/account')}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Link Kick Account First
              </Button>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-border/50"
              onClick={() => navigate('/account')}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Account
            </Button>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      {!hasKickLinked && (
        <section className="py-12 px-4 bg-red-500/10">
          <div className="max-w-4xl mx-auto">
            <Card className="gaming-card border-red-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Shield className="h-5 w-5" />
                  Requirements Not Met
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  To upgrade to a streamer account, you need to have a Kick channel linked to your account.
                </p>
                <Button 
                  onClick={() => navigate('/account')}
                  className="gaming-button"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Link Your Kick Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Streamer Features You'll Unlock
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage and grow your streaming community effectively.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {streamerBenefits.map((benefit, index) => (
              <Card key={index} className="gaming-card hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h3>
            <p className="text-lg text-muted-foreground">
              Simple 3-step process to unlock streamer features
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {upgradeSteps.map((step, index) => (
              <Card key={index} className="gaming-card relative">
                <CardHeader>
                  <div className="absolute -top-4 left-4">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {step.step}
                    </div>
                  </div>
                  <step.icon className="h-8 w-8 text-kick-green mb-2" />
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                  {step.step === 1 && hasKickLinked && (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gaming-card p-12">
            <Zap className="h-16 w-16 text-kick-green mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to Start Streaming?
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of streamers who use our platform to power their communities.
            </p>
            {hasKickLinked ? (
              <Button 
                size="lg" 
                className="gaming-button text-lg px-8 py-6"
                onClick={handleUpgradeToStreamer}
                disabled={loading}
              >
                <Crown className="h-5 w-5 mr-2" />
                {loading ? 'Upgrading Account...' : 'Upgrade to Streamer'}
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate('/account')}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Link Kick Account to Continue
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}