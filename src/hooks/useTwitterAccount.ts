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

  useEffect(() => {
    const checkTwitterAccount = async () => {
      if (!user) {
        setTwitterUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('linked_twitter_user_id, linked_twitter_username, linked_twitter_display_name, linked_twitter_avatar')
          .eq('user_id', user.id)
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
      } finally {
        setLoading(false);
      }
    };

    checkTwitterAccount();
  }, [user]);

  const isTwitterLinked = !!twitterUser?.authenticated;
  const hasSupabaseAccount = !!user;

  const linkTwitterAccount = async (twitterData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: {
          action: 'callback',
          ...twitterData
        }
      });

      if (error) throw error;

      if (data.success && data.twitterUser) {
        setTwitterUser({
          id: data.twitterUser.id,
          username: data.twitterUser.username,
          displayName: data.twitterUser.displayName,
          avatar: data.twitterUser.avatar,
          authenticated: true
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error linking Twitter account:', error);
      return { data: null, error };
    }
  };

  const unlinkTwitterAccount = async () => {
    if (!user) return { error: 'No user found' };

    try {
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

      setTwitterUser(null);
      return { error: null };
    } catch (error) {
      console.error('Error unlinking Twitter account:', error);
      return { error };
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