import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  authenticated: boolean;
}

export function useTwitterAccount() {
  const { user } = useAuth();
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTwitterUserData = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('linked_twitter_user_id, linked_twitter_username, linked_twitter_display_name, linked_twitter_avatar')
        .eq('user_id', userId)
        .single();

      if (!error && profile && profile.linked_twitter_user_id && profile.linked_twitter_username) {
        setTwitterUser({
          id: profile.linked_twitter_user_id,
          username: profile.linked_twitter_username,
          displayName: profile.linked_twitter_display_name || profile.linked_twitter_username,
          avatar: profile.linked_twitter_avatar || undefined,
          authenticated: true
        });
      } else {
        setTwitterUser(null);
      }
    } catch (error) {
      console.error('Error checking Twitter account:', error);
      setTwitterUser(null);
    }
  };

  useEffect(() => {
    const checkTwitterAccount = async () => {
      if (!user) {
        setTwitterUser(null);
        setLoading(false);
        return;
      }

      await fetchTwitterUserData(user.id);
      setLoading(false);
    };

    checkTwitterAccount();
  }, [user]);

  const isTwitterLinked = !!twitterUser?.authenticated;
  const hasSupabaseAccount = !!user;

  const linkTwitterAccount = async (twitterData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: {
          action: 'callback',
          code: twitterData.code,
          state: twitterData.state
        }
      });

      if (error) throw error;

      // Refresh Twitter user data after successful linking
      if (user) {
        await fetchTwitterUserData(user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error linking Twitter account:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const unlinkTwitterAccount = async () => {
    if (!user) return { data: null, error: new Error('No user found') };

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          linked_twitter_user_id: null,
          linked_twitter_username: null,
          linked_twitter_display_name: null,
          linked_twitter_avatar: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh Twitter user data after unlinking
      await fetchTwitterUserData(user.id);

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('Error unlinking Twitter account:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    twitterUser,
    loading,
    isTwitterLinked,
    hasSupabaseAccount,
    linkTwitterAccount,
    unlinkTwitterAccount
  };
}