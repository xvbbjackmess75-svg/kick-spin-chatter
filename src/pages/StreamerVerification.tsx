import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useDiscordAccount } from '@/hooks/useDiscordAccount';
import { useTwitterAccount } from '@/hooks/useTwitterAccount';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, AlertCircle, Shield, Star } from 'lucide-react';
import { LinkTwitterAccount } from '@/components/LinkTwitterAccount';
import { VerificationBadge } from '@/components/VerificationBadge';

interface VerificationStatus {
  kick_linked: boolean;
  discord_linked: boolean;
  twitter_linked: boolean;
  is_verified_streamer: boolean;
}

export default function StreamerVerification() {
  const { user } = useAuth();
  const { discordUser, isDiscordLinked } = useDiscordAccount();
  const { twitterUser, isTwitterLinked } = useTwitterAccount();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    kick_linked: true, // Always true since they logged in with Kick
    discord_linked: false,
    twitter_linked: false,
    is_verified_streamer: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .rpc('get_user_verification_status', { _user_id: user.id });
        
        if (data && typeof data === 'object') {
          const statusData = data as any;
          setVerificationStatus({
            kick_linked: statusData.kick_linked || false,
            discord_linked: statusData.discord_linked || false,
            twitter_linked: statusData.twitter_linked || false,
            is_verified_streamer: statusData.is_verified_streamer || false
          });
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [user]);

  // Update verification status when accounts are linked/unlinked
  useEffect(() => {
    if (!user) return;

    const updateVerificationStatus = async () => {
      const newStatus = {
        kick_linked: true,
        discord_linked: isDiscordLinked,
        twitter_linked: isTwitterLinked,
        is_verified_streamer: verificationStatus.is_verified_streamer
      };

      // Update profile with new verification status
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: newStatus
        })
        .eq('user_id', user.id);

      if (!error) {
        setVerificationStatus(prev => ({
          ...prev,
          discord_linked: isDiscordLinked,
          twitter_linked: isTwitterLinked
        }));
      }
    };

    updateVerificationStatus();
  }, [isDiscordLinked, isTwitterLinked, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isFullyVerified = verificationStatus.kick_linked && 
                         verificationStatus.discord_linked && 
                         verificationStatus.twitter_linked;

  const getStatusIcon = (status: boolean) => {
    if (status) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Streamer Verification</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete your verification to unlock the verified streamer badge and access to premium features.
          </p>
          
          {isFullyVerified && (
            <div className="flex justify-center">
              <VerificationBadge 
                isVerified={verificationStatus.is_verified_streamer}
                type="verified_streamer"
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Status
            </CardTitle>
            <CardDescription>
              Complete all requirements to earn your verified streamer badge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {/* Kick Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(verificationStatus.kick_linked)}
                  <div>
                    <p className="font-medium">Kick Account</p>
                    <p className="text-sm text-muted-foreground">Connected via OAuth</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Connected
                </Badge>
              </div>

              {/* Discord Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(verificationStatus.discord_linked)}
                  <div>
                    <p className="font-medium">Discord Account</p>
                    <p className="text-sm text-muted-foreground">
                      {isDiscordLinked && discordUser ? 
                        `@${discordUser.username}` : 
                        'Link your Discord account'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={
                  verificationStatus.discord_linked 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }>
                  {verificationStatus.discord_linked ? 'Connected' : 'Pending'}
                </Badge>
              </div>

              {/* Twitter Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(verificationStatus.twitter_linked)}
                  <div>
                    <p className="font-medium">X (Twitter) Account</p>
                    <p className="text-sm text-muted-foreground">
                      {isTwitterLinked && twitterUser ? 
                        `@${twitterUser.username}` : 
                        'Link your X account'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={
                  verificationStatus.twitter_linked 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }>
                  {verificationStatus.twitter_linked ? 'Connected' : 'Pending'}
                </Badge>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Verification Progress</span>
              </div>
              <div className="flex gap-2 mb-2">
                {[verificationStatus.kick_linked, verificationStatus.discord_linked, verificationStatus.twitter_linked].map((status, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full ${
                      status ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {isFullyVerified 
                  ? 'All requirements completed! You now have the verified streamer badge.'
                  : `${[verificationStatus.kick_linked, verificationStatus.discord_linked, verificationStatus.twitter_linked].filter(Boolean).length}/3 requirements completed`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Linking */}
        <div className="grid md:grid-cols-1 gap-6">
          <LinkTwitterAccount />
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Verified Streamer Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Special verified streamer badge in giveaways
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Enhanced trust indicators for your audience
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Priority support and feature access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Advanced analytics and insights
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}