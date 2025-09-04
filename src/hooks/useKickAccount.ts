import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface KickUser {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  authenticated: boolean;
}

interface KickTokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export function useKickAccount() {
  const { user } = useAuth();
  const [kickUser, setKickUser] = useState<KickUser | null>(null);
  const [kickToken, setKickToken] = useState<KickTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKickAccount = async () => {
      try {
        // First check if user has a linked Kick account in their profile
        if (user) {
          console.log('🔍 Checking database for linked Kick account...');
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('linked_kick_user_id, linked_kick_username, linked_kick_avatar, kick_username, kick_user_id')
            .eq('user_id', user.id)
            .single();

          if (!error && profile) {
            console.log('📊 Profile data found:', profile);
            
            // Check if we have linked Kick data in the database
            if (profile.linked_kick_user_id && profile.linked_kick_username) {
              console.log('✅ Found linked Kick account in database');
              setKickUser({
                id: parseInt(profile.linked_kick_user_id),
                username: profile.linked_kick_username,
                display_name: profile.linked_kick_username,
                avatar: profile.linked_kick_avatar || '',
                authenticated: true
              });
            } else if (profile.kick_user_id && profile.kick_username) {
              // Fallback to old kick_username field
              console.log('✅ Found Kick account in old fields');
              
              // Try to get avatar from user metadata if available
              let avatarUrl = '';
              try {
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user?.user_metadata?.kick_avatar) {
                  avatarUrl = userData.user?.user_metadata?.kick_avatar;
                  console.log('🖼️ Found avatar in user metadata:', avatarUrl);
                } else {
                  // Fallback to standard Kick avatar URL format
                  avatarUrl = `https://files.kick.com/images/user/${profile.kick_username}/profile_image/conversion/300x300-medium.webp`;
                  console.log('🖼️ Using fallback avatar URL:', avatarUrl);
                }
              } catch {
                // Fallback to standard format if metadata access fails
                avatarUrl = `https://files.kick.com/images/user/${profile.kick_username}/profile_image/conversion/300x300-medium.webp`;
                console.log('🖼️ Using fallback avatar URL (catch):', avatarUrl);
              }
              
              setKickUser({
                id: parseInt(profile.kick_user_id),
                username: profile.kick_username,
                display_name: profile.kick_username,
                avatar: avatarUrl,
                authenticated: true
              });
            }
          } else {
            console.log('❌ No profile found or error:', error);
          }
        }

        // Also check localStorage for token data
        const kickTokenData = localStorage.getItem('kick_token');
        if (kickTokenData) {
          setKickToken(JSON.parse(kickTokenData));
        }

        // If no database link found, check localStorage (for standalone Kick users)
        if (!kickUser) {
          const kickUserData = localStorage.getItem('kick_user');
          if (kickUserData) {
            const parsedKickUser = JSON.parse(kickUserData);
            if (parsedKickUser.authenticated) {
              console.log('📱 Found Kick user in localStorage only');
              setKickUser(parsedKickUser);
            }
          }
        }
      } catch (error) {
        console.error('Error checking Kick account:', error);
        setKickUser(null);
        setKickToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkKickAccount();

    // Listen for storage changes (when user links/unlinks account)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kick_user' || e.key === 'kick_token') {
        checkKickAccount();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, kickUser]);

  const isKickLinked = !!(kickUser?.authenticated && (user || kickToken?.access_token));
  
  // Check for hybrid session even if Supabase user is not confirmed
  const hybridSession = localStorage.getItem('kick_hybrid_session');
  const hasHybridAccount = hybridSession ? JSON.parse(hybridSession).authenticated : false;
  
  const hasSupabaseAccount = !!user || hasHybridAccount;
  const canUseChatbot = isKickLinked && hasSupabaseAccount;

  // Debug logging
  console.log('🔧 useKickAccount debug:', {
    kickUser: kickUser?.username,
    kickUserAvatar: kickUser?.avatar,
    hasKickToken: !!kickToken?.access_token,
    supabaseUser: user?.email,
    hasHybridAccount,
    hybridSession: !!hybridSession,
    isKickLinked,
    hasSupabaseAccount,
    canUseChatbot,
    userHasProfile: !!user
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
    kickToken,
    loading,
    isKickLinked,
    hasSupabaseAccount,
    canUseChatbot,
    getChannelInfo
  };
}