import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

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
    const checkKickAccount = () => {
      try {
        // Get Kick user data
        const kickUserData = localStorage.getItem('kick_user');
        if (kickUserData) {
          const parsedKickUser = JSON.parse(kickUserData);
          if (parsedKickUser.authenticated) {
            setKickUser(parsedKickUser);
          }
        }

        // Get Kick token data
        const kickTokenData = localStorage.getItem('kick_token');
        if (kickTokenData) {
          setKickToken(JSON.parse(kickTokenData));
        }
      } catch (error) {
        console.error('Error parsing Kick account data:', error);
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
  }, []);

  const isKickLinked = !!(kickUser?.authenticated && kickToken?.access_token);
  const hasSupabaseAccount = !!user;
  const canUseChatbot = isKickLinked && hasSupabaseAccount;

  // Debug logging
  console.log('🔧 useKickAccount debug:', {
    kickUser: kickUser?.username,
    hasKickToken: !!kickToken?.access_token,
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
    kickToken,
    loading,
    isKickLinked,
    hasSupabaseAccount,
    canUseChatbot,
    getChannelInfo
  };
}