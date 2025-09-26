import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useKickAccount } from '@/hooks/useKickAccount';
import { 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  Link, 
  Bot,
  Users
} from 'lucide-react';

interface KickAccountGuardProps {
  children: ReactNode;
  feature: string;
  description: string;
}

export function KickAccountGuard({ children, feature, description }: KickAccountGuardProps) {
  const { 
    kickUser, 
    loading, 
    isKickLinked, 
    hasSupabaseAccount, 
    canUseChatbot, 
    getChannelInfo 
  } = useKickAccount();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Checking account status...</p>
        </div>
      </div>
    );
  }

  if (!hasSupabaseAccount) {
    return (
      <Card className="gaming-card">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-4">Account Required</h3>
          <p className="text-muted-foreground mb-6">
            You need to create an account to access {feature}.
          </p>
          <Button 
            className="gaming-button"
            onClick={() => window.location.href = '/auth'}
          >
            Create Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isKickLinked) {
    return (
      <Card className="gaming-card">
        <CardContent className="p-8 text-center">
          <Bot className="h-16 w-16 text-kick-purple mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-4">Kick Account Required</h3>
          <p className="text-lg text-muted-foreground mb-4">
            To use {feature}, you need to link your Kick account.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {description}
          </p>
          
          <div className="space-y-4">
            <Alert className="text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Why link your Kick account?</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Use chatbot commands on your own channel</li>
                  <li>• Manage your stream's chat interactions</li>
                  <li>• Run giveaways with real-time chat monitoring</li>
                  <li>• Secure access with your own API credentials</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              className="gaming-button w-full"
              onClick={() => window.location.href = '/account'}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Link Your Kick Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canUseChatbot) {
    return (
      <Card className="gaming-card">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-4">Setup Incomplete</h3>
          <p className="text-muted-foreground mb-6">
            Your account setup is incomplete. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  const channelInfo = getChannelInfo();

  return (
    <div className="space-y-6">
      {/* Account Status Header */}
      <Card className="gaming-card border-kick-green/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-kick-green" />
              <span>Connected to Kick</span>
            </div>
            <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={kickUser?.avatar || '/placeholder-avatar.jpg'} 
                alt={kickUser?.username}
                className="w-12 h-12 rounded-full border-2 border-kick-green/30"
                onLoad={() => {
                  console.log('✅ Avatar loaded successfully:', kickUser?.avatar);
                }}
                onError={(e) => {
                  console.error('❌ Avatar failed to load:', kickUser?.avatar);
                  // Try fallback avatar URL
                  const fallbackUrl = kickUser?.username 
                    ? `https://files.kick.com/images/user/${kickUser.username}/profile_image/conversion/150x150-small.webp`
                    : '/placeholder-avatar.jpg';
                  e.currentTarget.src = fallbackUrl;
                }}
              />
              <div>
                <p className="font-semibold text-foreground">
                  @{channelInfo?.channelName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {channelInfo?.displayName}
                </p>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Channel: {channelInfo?.channelName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bot className="h-4 w-4" />
                <span>Bot Ready</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protected Content */}
      {children}
    </div>
  );
}