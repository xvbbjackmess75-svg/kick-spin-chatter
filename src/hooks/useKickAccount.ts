import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface KickUser {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  authenticated: boolean;
}

interface KickApiUser {
  id: number;
  username: string;
  slug: string;
  profile_pic?: string;
  user?: {
    profile_pic?: string;
  };
}

// Function to get Kick avatar URL (simplified approach)
const getKickAvatarUrl = (username: string): string => {
  // Try multiple possible avatar URL formats
  const formats = [
    `https://files.kick.com/images/user/${username}/profile_picture`,
    `https://files.kick.com/images/user/${username.toLowerCase()}/profile_picture`,
    `https://kick.com/api/v1/users/${username}/avatar`,
    `https://files.kick.com/images/user/${username}/avatar`,
    // Fallback to a working format we know exists
    `https://ui-avatars.com/api/?name=${username}&background=0d1117&color=fff&size=200`
  ];
  
  console.log('🖼️ Generated avatar URLs for', username, ':', formats);
  
  // For now, return the ui-avatars fallback since Kick images have CORS issues
  return formats[formats.length - 1];
};

export function useKickAccount() {
  const { user } = useAuth();
  const [kickUser, setKickUser] = useState<KickUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKickAccount = async () => {
      if (!user) {
        console.log('❌ No user, setting kickUser to null');
        setKickUser(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Checking for linked Kick account...');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('linked_kick_user_id, linked_kick_username, linked_kick_avatar, kick_username, kick_user_id')
          .eq('user_id', user.id)
          .single();

        if (!error && profile) {
          console.log('📊 Profile data found:', profile);
          
          // Check for linked Kick data first (new format)
          if (profile.linked_kick_user_id && profile.linked_kick_username) {
            console.log('✅ Found linked Kick account');
            
            // Use a working avatar URL format
            const avatarUrl = getKickAvatarUrl(profile.linked_kick_username);
            console.log('🖼️ Using avatar URL:', avatarUrl);
            
            setKickUser({
              id: parseInt(profile.linked_kick_user_id),
              username: profile.linked_kick_username,
              display_name: profile.linked_kick_username,
              avatar: avatarUrl,
              authenticated: true
            });
          } 
          // Fallback to old format if linked data doesn't exist
          else if (profile.kick_user_id && profile.kick_username) {
            console.log('✅ Found Kick account (legacy format)');
            
            // Use a working avatar URL format
            const avatarUrl = getKickAvatarUrl(profile.kick_username);
            console.log('🖼️ Using avatar URL:', avatarUrl);
            
            setKickUser({
              id: parseInt(profile.kick_user_id),
              username: profile.kick_username,
              display_name: profile.kick_username,
              avatar: avatarUrl,
              authenticated: true
            });
          } else {
            console.log('❌ No Kick account linked');
            setKickUser(null);
          }
        } else {
          console.log('❌ No profile found or error:', error);
          setKickUser(null);
        }
      } catch (error) {
        console.error('Error checking Kick account:', error);
        setKickUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkKickAccount();
  }, [user]);

  const isKickLinked = !!kickUser?.authenticated;
  const hasSupabaseAccount = !!user;
  const canUseChatbot = isKickLinked && hasSupabaseAccount;

  // Debug logging
  console.log('🔧 useKickAccount debug:', {
    kickUser: kickUser?.username,
    kickUserAvatar: kickUser?.avatar,
    avatarLength: kickUser?.avatar?.length,
    supabaseUser: user?.email,
    isKickLinked,
    hasSupabaseAccount,
    canUseChatbot
  });

  const getChannelInfo = () => {
    if (!kickUser) return null;
    
    return {
      channelName: kickUser.username,
      channelId: kickUser.id.toString(),
      displayName: kickUser.display_name || kickUser.username
    };
  };

  return {
    kickUser,
    kickToken: null, // No longer needed for linking-only approach
    loading,
    isKickLinked,
    hasSupabaseAccount,
    canUseChatbot,
    getChannelInfo
  };
}