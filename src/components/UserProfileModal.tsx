import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Crown, Shield, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { VerificationBadge } from "./VerificationBadge";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
  user_id: string;
  display_name?: string;
  kick_username?: string;
  kick_user_id?: string;
  avatar_url?: string;
  custom_avatar_url?: string;
  linked_kick_username?: string;
  linked_kick_avatar?: string;
  is_streamer?: boolean;
  is_kick_hybrid?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatar?: string;
  isVerified?: boolean;
}

export function UserProfileModal({
  isOpen,
  onClose,
  username,
  avatar,
  isVerified = false
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && username) {
      fetchUserProfile();
    }
  }, [isOpen, username]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // First try to find by kick_username, then by linked_kick_username
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`kick_username.eq.${username},linked_kick_username.eq.${username}`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error", 
        description: "Failed to load user profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayAvatar = () => {
    if (profile?.custom_avatar_url) return profile.custom_avatar_url;
    if (profile?.linked_kick_avatar) return profile.linked_kick_avatar;
    if (profile?.avatar_url) return profile.avatar_url;
    return avatar;
  };

  const getDisplayName = () => {
    return profile?.display_name || profile?.kick_username || profile?.linked_kick_username || username;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountType = () => {
    if (profile?.is_streamer) return 'Streamer';
    if (profile?.is_kick_hybrid) return 'Hybrid Account';
    if (isVerified) return 'Verified Viewer';
    return 'Viewer';
  };

  const getAccountTypeBadgeVariant = () => {
    if (profile?.is_streamer) return 'default';
    if (profile?.is_kick_hybrid) return 'secondary';
    if (isVerified) return 'outline';
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gaming-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-kick-green" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kick-green"></div>
            </div>
          ) : (
            <>
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-24 h-24 border-4 border-kick-green/20">
                  <AvatarImage 
                    src={getDisplayAvatar()}
                    alt={getDisplayName()}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-avatar.jpg';
                    }}
                  />
                  <AvatarFallback className="bg-kick-green text-kick-dark text-2xl font-bold">
                    {getDisplayName().slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{getDisplayName()}</h3>
                    {isVerified && (
                      <VerificationBadge 
                        isVerified={true} 
                        size="sm" 
                        showText={false}
                      />
                    )}
                  </div>
                  
                  <Badge variant={getAccountTypeBadgeVariant()} className="text-xs">
                    {profile?.is_streamer && <Crown className="h-3 w-3 mr-1" />}
                    {isVerified && <Shield className="h-3 w-3 mr-1" />}
                    {getAccountType()}
                  </Badge>
                </div>
              </div>

              {/* Profile Details */}
              <Card className="gaming-card">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-foreground mb-3">Profile Information</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Username:</span>
                      <span className="text-foreground font-medium">{username}</span>
                    </div>
                    
                    {profile?.display_name && profile.display_name !== username && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Display Name:</span>
                        <span className="text-foreground font-medium">{profile.display_name}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Type:</span>
                      <span className="text-foreground font-medium">{getAccountType()}</span>
                    </div>
                    
                    {profile?.created_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="text-foreground font-medium">{formatDate(profile.created_at)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Kick Profile Link */}
              {(profile?.kick_username || profile?.linked_kick_username) && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    const kickUsername = profile?.kick_username || profile?.linked_kick_username;
                    window.open(`https://kick.com/${kickUsername}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Kick Profile
                </Button>
              )}

              {/* No Profile Found */}
              {!profile && !loading && (
                <Card className="gaming-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      This user hasn't created a profile yet or isn't registered on the platform.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}