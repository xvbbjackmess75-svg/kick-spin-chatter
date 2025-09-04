import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Award, 
  Gift,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  MessageSquare,
  Crown
} from 'lucide-react';

const benefits = [
  {
    icon: Shield,
    title: "Get Verified Status",
    description: "Link your Kick and Discord accounts to get verified and prevent alt accounts",
    color: "text-blue-500"
  },
  {
    icon: Award,
    title: "Verification Badge",
    description: "Show your verified status with a special badge in giveaways and events",
    color: "text-purple-500"
  },
  {
    icon: Gift,
    title: "Extra Chances in Giveaways",
    description: "Verified viewers get increased chances to win in participating giveaways",
    color: "text-green-500"
  },
  {
    icon: Users,
    title: "Trusted Community Member",
    description: "Help streamers maintain fair giveaways by proving you're a real viewer",
    color: "text-orange-500"
  }
];

const steps = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Sign up with your email to get started",
    icon: Users
  },
  {
    step: 2,
    title: "Link Your Kick Account",
    description: "Connect your Kick profile for verification",
    icon: MessageSquare
  },
  {
    step: 3,
    title: "Link Your Discord Account",
    description: "Connect Discord to complete verification",
    icon: Shield
  },
  {
    step: 4,
    title: "Get Verified Status",
    description: "Enjoy verified benefits in giveaways and events",
    icon: Star
  }
];

export default function ViewerBenefits() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-gaming opacity-20" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-12 w-12 text-kick-green" />
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Viewer Verification
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Become a
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Verified Viewer</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join the trusted community! Link your Kick and Discord accounts to get verified status, 
            prevent alt accounts, and enjoy exclusive benefits in giveaways and events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gaming-button text-lg px-8 py-6"
              onClick={() => navigate('/viewer-registration')}
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Get Verified Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-border/50"
              onClick={() => navigate('/streamer-auth')}
            >
              <Crown className="h-5 w-5 mr-2" />
              I'm a Streamer
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Why Get Verified?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Verification helps create a fair and trusted environment for everyone in the community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="gaming-card hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <benefit.icon className={`h-12 w-12 mx-auto ${benefit.color}`} />
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
              Get verified in just 4 simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Streamers Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Benefits for Streamers
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamers can use referral links and verification-only giveaways to ensure fair participation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="gaming-card">
              <CardHeader>
                <Shield className="h-8 w-8 text-kick-green mb-2" />
                <CardTitle>Prevent Alt Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Verification helps prevent fake accounts and bots from participating in your giveaways, 
                  ensuring fair competition for real viewers.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Referral link tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Verified-only giveaways</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Increased verified chances</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gaming-card">
              <CardHeader>
                <Star className="h-8 w-8 text-kick-green mb-2" />
                <CardTitle>Enhanced Giveaway Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose to make giveaways verified-only or give verified viewers increased chances to win, 
                  rewarding your most trusted community members.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Verified participant filtering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Bonus chances for verified users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Trust score tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gaming-card p-12">
            <Zap className="h-16 w-16 text-kick-green mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to Get Verified?
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Join the trusted community and unlock exclusive benefits in giveaways and events.
            </p>
            <Button 
              size="lg" 
              className="gaming-button text-lg px-8 py-6"
              onClick={() => navigate('/viewer-registration')}
            >
              <Shield className="h-5 w-5 mr-2" />
              Start Verification Process
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}