import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  global_name?: string;
  authenticated: boolean;
}

export function useDiscordAccount() {
  const { user, loading: authLoading } = useAuth();
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDiscordAccount = async () => {
      console.log('🔧 useDiscordAccount: checkDiscordAccount called, user:', user?.email || 'null', 'authLoading:', authLoading);
      
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Auth still loading, waiting...');
        return;
      }
      
      if (!user) {
        console.log('❌ No user, setting discordUser to null');
        setDiscordUser(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Checking for linked Discord account...');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('linked_discord_user_id, linked_discord_username, linked_discord_avatar, linked_discord_discriminator')
          .eq('user_id', user.id)
          .single();

        if (!error && profile) {
          console.log('📊 Profile data found:', profile);
          
          // Check for linked Discord data
          if (profile.linked_discord_user_id && profile.linked_discord_username) {
            console.log('✅ Found linked Discord account');
            
            setDiscordUser({
              id: profile.linked_discord_user_id,
              username: profile.linked_discord_username,
              discriminator: profile.linked_discord_discriminator || '0000',
              avatar: profile.linked_discord_avatar || `https://ui-avatars.com/api/?name=${profile.linked_discord_username}&background=5865F2&color=fff&size=200&bold=true`,
              authenticated: true
            });
          } else {
            console.log('❌ No Discord account linked');
            setDiscordUser(null);
          }
        } else {
          console.log('❌ No profile found or error:', error);
          setDiscordUser(null);
        }
      } catch (error) {
        console.error('Error checking Discord account:', error);
        setDiscordUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkDiscordAccount();
  }, [user, authLoading]);

  const isDiscordLinked = !!discordUser?.authenticated;
  const hasSupabaseAccount = !!user;

  // Debug logging
  console.log('🔧 useDiscordAccount debug:', {
    user: user?.email || 'null',
    discordUser: discordUser?.username || 'null',
    discordUserAvatar: discordUser?.avatar?.substring(0, 50) + '...' || 'null',
    supabaseUser: user?.email || 'null',
    isDiscordLinked,
    hasSupabaseAccount,
    loading
  });

  const linkDiscordAccount = async (discordData: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    global_name?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    console.log('🔗 Linking Discord account:', discordData.username);

    const { error } = await supabase.functions.invoke('discord-oauth', {
      body: {
        action: 'link',
        user_id: user.id,
        discord_user_id: discordData.id,
        discord_username: discordData.username,
        discord_avatar: discordData.avatar,
        discord_discriminator: discordData.discriminator
      }
    });

    if (error) throw error;

    // Refresh the discord account data
    const avatarUrl = discordData.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png`
      : `https://ui-avatars.com/api/?name=${discordData.username}&background=5865F2&color=fff&size=200&bold=true`;

    setDiscordUser({
      id: discordData.id,
      username: discordData.username,
      discriminator: discordData.discriminator,
      avatar: avatarUrl,
      global_name: discordData.global_name,
      authenticated: true
    });

    console.log('✅ Discord account linked successfully');
  };

  const unlinkDiscordAccount = async () => {
    if (!user) throw new Error('User not authenticated');

    console.log('🔗 Unlinking Discord account');

    const { error } = await supabase
      .from('profiles')
      .update({
        linked_discord_user_id: null,
        linked_discord_username: null,
        linked_discord_avatar: null,
        linked_discord_discriminator: null
      })
      .eq('user_id', user.id);

    if (error) throw error;

    setDiscordUser(null);
    console.log('✅ Discord account unlinked successfully');
  };

  return {
    discordUser,
    loading,
    isDiscordLinked,
    hasSupabaseAccount,
    linkDiscordAccount,
    unlinkDiscordAccount
  };
}