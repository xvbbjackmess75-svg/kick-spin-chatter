import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  MessageSquare, 
  Gift, 
  Users, 
  BarChart3, 
  Shield,
  ArrowRight,
  CheckCircle,
  Bot,
  Monitor,
  Trophy,
  Sparkles,
  Target,
  Play,
  ExternalLink,
  Dice6,
  Crown
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: "Smart Chat Bot",
    description: "AI-powered chat responses with custom commands, automatic moderation, and intelligent viewer interaction"
  },
  {
    icon: Gift,
    title: "Slots Call System",
    description: "Revolutionary overlay system for managing slot machine calls with real-time tracking and winner announcements"
  },
  {
    icon: BarChart3,
    title: "Bonus Hunt Manager",
    description: "Complete bonus hunt session tracking with live overlays, balance monitoring, and payout calculations"
  },
  {
    icon: Shield,
    title: "Giveaway Automation",
    description: "Advanced giveaway system with Kick chat integration, fair winner selection, and automated entry management"
  },
  {
    icon: Users,
    title: "Viewer Verification",
    description: "Link Discord and Kick accounts for verified status, extra giveaway chances, and community trust badges"
  },
  {
    icon: Bot,
    title: "Real-time Overlays",
    description: "Professional OBS overlays for slots calls, bonus hunts, and giveaways with customizable themes"
  }
];

const showcaseFeatures = [
  {
    title: "Slots Call Overlay System",
    description: "Professional OBS overlay for managing slot machine calls with real-time queue, winner tracking, and customizable themes",
    features: [
      "Real-time call queue with viewer tracking",
      "Top multiplier display and winner announcements", 
      "Customizable colors, fonts, and animations",
      "Secure overlay URLs for OBS integration",
      "Auto-scrolling for long call lists"
    ],
    demoUrl: "/slots-overlay",
    color: "from-blue-500 to-purple-600"
  },
  {
    title: "Bonus Hunt Manager",
    description: "Complete bonus hunt session management with live balance tracking, bet monitoring, and payout calculations",
    features: [
      "Live session balance updates",
      "Individual bet tracking with multipliers",
      "Professional overlay for stream display",
      "Automatic profit/loss calculations",
      "Session completion tracking"
    ],
    demoUrl: "/bonus-hunt-overlay",
    color: "from-green-500 to-emerald-600"
  },
  {
    title: "Giveaway System",
    description: "Advanced giveaway management with Kick chat integration and provably fair winner selection",
    features: [
      "Kick chat integration for automatic entries",
      "Provably fair roulette system",
      "Viewer verification with Discord linking",
      "Multiple winner support",
      "Entry management and moderation"
    ],
    demoUrl: "/giveaways",
    color: "from-orange-500 to-red-600"
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Basic slots call overlay",
      "Up to 5 bonus hunt sessions",
      "Simple giveaway features", 
      "Community support"
    ],
    popular: false
  },
  {
    name: "Streamer Pro",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited slots call overlays",
      "Advanced bonus hunt tracking",
      "Professional overlay themes",
      "Kick chat integration",
      "Priority support",
      "Custom branding"
    ],
    popular: true
  },
  {
    name: "Casino Partner",
    price: "$29.99",
    period: "/month",
    features: [
      "Everything in Streamer Pro",
      "Multiple streamer accounts",
      "White-label solutions",
      "API access",
      "Dedicated support",
      "Custom integrations"
    ],
    popular: false
  }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-gaming opacity-20" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Zap className="h-12 w-12 text-kick-green" />
              <div className="absolute inset-0 animate-pulse">
                <Zap className="h-12 w-12 text-kick-green opacity-50" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KickBot
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            The Ultimate
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Casino Streaming</span>
            <br />Platform
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Professional overlay systems, slot call management, bonus hunt tracking, and giveaway automation. 
            Everything you need to take your gambling streams to the next level.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gaming-button text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-border/50"
              onClick={() => navigate('/viewer-benefits')}
            >
              <Users className="h-5 w-5 mr-2" />
              You're a viewer ?
            </Button>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-20 px-4 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4 mr-2" />
              Live Showcase
            </Badge>
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Experience Our Overlay Systems
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              See how our professional overlay systems work in real-time. Perfect for casino streamers 
              looking to enhance their viewers' experience.
            </p>
          </div>
          
          <div className="space-y-16">
            {showcaseFeatures.map((feature, index) => (
              <div key={index} className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${feature.color} p-1`}>
                <div className="bg-background rounded-xl p-8 md:p-12">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <h4 className="text-3xl font-bold text-foreground mb-4">
                        {feature.title}
                      </h4>
                      <p className="text-lg text-muted-foreground mb-6">
                        {feature.description}
                      </p>
                      
                      <div className="space-y-3 mb-8">
                        {feature.features.map((feat, fIndex) => (
                          <div key={fIndex} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{feat}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          className="gaming-button"
                          onClick={() => navigate(feature.demoUrl)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          View Live Demo
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate('/auth')}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Get Started
                        </Button>
                      </div>
                    </div>
                    
                    <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-xl blur-xl group-hover:opacity-30 transition-opacity duration-300" />
                        <Card className="relative gaming-card overflow-hidden">
                          <CardContent className="p-6">
                            <div className="aspect-video bg-gradient-to-br from-background via-secondary/20 to-primary/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                              <div className="relative z-10 text-center">
                                {index === 0 && (
                                  <div className="space-y-4">
                                    <Dice6 className="h-16 w-16 text-primary mx-auto" />
                                    <div className="text-sm text-muted-foreground">
                                      Slots Call Overlay Preview
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs">
                                      <Monitor className="h-4 w-4" />
                                      <span>OBS Ready</span>
                                    </div>
                                  </div>
                                )}
                                {index === 1 && (
                                  <div className="space-y-4">
                                    <Trophy className="h-16 w-16 text-primary mx-auto" />
                                    <div className="text-sm text-muted-foreground">
                                      Bonus Hunt Manager
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs">
                                      <BarChart3 className="h-4 w-4" />
                                      <span>Live Tracking</span>
                                    </div>
                                  </div>
                                )}
                                {index === 2 && (
                                  <div className="space-y-4">
                                    <Crown className="h-16 w-16 text-primary mx-auto" />
                                    <div className="text-sm text-muted-foreground">
                                      Giveaway System
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs">
                                      <Users className="h-4 w-4" />
                                      <span>Kick Integration</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Why Casino Streamers Choose KickBot
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for gambling streamers who want professional tools 
              to engage their audience and manage their content effectively.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="gaming-card hover:scale-105 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="mb-4 relative">
                    <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-full blur-xl group-hover:opacity-30 transition-opacity duration-300" />
                    <feature.icon className="h-8 w-8 text-kick-green relative z-10" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Choose Your Streaming Plan
            </h3>
            <p className="text-lg text-muted-foreground">
              From hobby streamers to casino partners - we have the right plan for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`gaming-card relative ${
                  plan.popular ? 'border-kick-green ring-2 ring-kick-green/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h4>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-kick-green" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular ? 'gaming-button' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    onClick={() => navigate('/auth')}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gaming-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Ready to Revolutionize Your Casino Streams?
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Join hundreds of casino streamers using KickBot to create engaging content and build their communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="gaming-button text-lg px-8 py-6"
                  onClick={() => navigate('/auth')}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Start Your Free Trial
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-border/50"
                  onClick={() => navigate('/slots-overlay')}
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View Live Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}