import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole, isViewerRole } from "@/hooks/useUserRole";
import ViewerDashboard from "@/components/ViewerDashboard";
import { 
  Gift, 
  Users,
  Trophy,
  Monitor,
  Zap,
  Settings,
  Bot,
  MessageSquare,
  Target,
  Star,
  ArrowRight,
  Crown,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { role, loading } = useUserRole();
  
  // Show loading while role is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Show viewer dashboard for viewer roles, streamer dashboard for all others
  if (isViewerRole(role)) {
    return <ViewerDashboard />;
  }
  
  // Mock data for demo
  const stats = {
    totalGiveaways: 24,
    totalParticipants: 1247,
    activeGiveaways: 3,
    avgParticipation: 156
  };

  const features = [
    {
      icon: Gift,
      title: "Smart Giveaways",
      description: "Create and manage interactive giveaways with real-time chat integration",
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/giveaways"
    },
    {
      icon: Trophy,
      title: "Giveaway History",
      description: "View your past giveaways, winners, and participation stats",
      color: "text-accent",
      bgColor: "bg-accent/10",
      path: "/history"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-primary/10 rounded-xl border border-primary/20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-12 w-12 text-kick-green" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Streamer Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            The ultimate streaming companion for Kick.com creators. Engage your audience with 
            interactive giveaways, smart chat moderation, and powerful automation tools.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button className="gaming-button" size="lg" onClick={() => navigate("/giveaways")}>
              <Gift className="h-5 w-5 mr-2" />
              Start Your First Giveaway
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gaming-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalGiveaways}</p>
                <p className="text-sm text-muted-foreground">Total Giveaways</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gaming-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-kick-green/10 rounded-lg">
                <Users className="h-6 w-6 text-kick-green" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalParticipants.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gaming-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Crown className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.activeGiveaways}</p>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gaming-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-400/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgParticipation}</p>
                <p className="text-sm text-muted-foreground">Avg. Participation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">Platform Features</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {features.map((feature, index) => (
            <Card key={index} className="gaming-card hover:scale-[1.02] transition-all duration-200 cursor-pointer" onClick={() => navigate(feature.path)}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${feature.bgColor} rounded-lg`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-primary hover:text-primary/80 transition-colors">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}