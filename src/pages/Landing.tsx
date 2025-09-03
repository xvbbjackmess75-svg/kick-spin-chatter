import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Bot
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: "Custom Commands",
    description: "Create unlimited custom chat commands with cooldowns and permissions"
  },
  {
    icon: Gift,
    title: "Automated Giveaways",
    description: "Run engaging giveaways with automatic winner selection and management"
  },
  {
    icon: BarChart3,
    title: "Chat Analytics",
    description: "Monitor chat activity, user engagement, and command usage in real-time"
  },
  {
    icon: Shield,
    title: "Auto Moderation",
    description: "Advanced moderation tools to keep your chat clean and friendly"
  },
  {
    icon: Users,
    title: "User Management",
    description: "Track viewers, subscribers, and moderators with detailed insights"
  },
  {
    icon: Bot,
    title: "Smart Bot",
    description: "AI-powered responses and intelligent chat interaction capabilities"
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Up to 10 custom commands",
      "Basic giveaway features",
      "Chat monitoring",
      "Community support"
    ],
    popular: false
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited commands",
      "Advanced giveaways",
      "Real-time analytics",
      "Auto moderation",
      "Priority support",
      "Custom integrations"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$29.99",
    period: "/month",
    features: [
      "Everything in Pro",
      "Multiple channels",
      "Custom branding",
      "API access",
      "Dedicated support",
      "Advanced analytics"
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
            Supercharge Your
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Kick Stream</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The ultimate bot platform for Kick streamers. Automate your chat, run giveaways, 
            moderate your community, and engage with your audience like never before.
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
            >
              <Users className="h-5 w-5 mr-2" />
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Dominate
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for Kick streamers to grow their community 
              and create engaging experiences.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="gaming-card hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <feature.icon className="h-8 w-8 text-kick-green" />
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
              Choose Your Plan
            </h3>
            <p className="text-lg text-muted-foreground">
              Start free and upgrade as your stream grows
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
          <div className="gaming-card p-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to Level Up Your Stream?
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of streamers who trust KickBot to power their communities.
            </p>
            <Button 
              size="lg" 
              className="gaming-button text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              <Zap className="h-5 w-5 mr-2" />
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}