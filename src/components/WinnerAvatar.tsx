import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { getBestAvatar, getUserInitials } from '@/lib/avatarUtils';

interface WinnerAvatarProps {
  username: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WinnerAvatar({ username, className = '', size = 'md' }: WinnerAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  useEffect(() => {
    async function fetchCustomAvatar() {
      try {
        // Try to find a profile with this Kick username
        const { data: profileData } = await supabase
          .from('profiles')
          .select('custom_avatar_url')
          .eq('linked_kick_username', username)
          .single();

        const avatar = getBestAvatar({
          customAvatar: profileData?.custom_avatar_url,
          kickUsername: username
        });

        setAvatarUrl(avatar);
      } catch (error) {
        // If no profile found, just use the Kick avatar
        const avatar = getBestAvatar({
          kickUsername: username
        });
        setAvatarUrl(avatar);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomAvatar();
  }, [username]);

  const initials = getUserInitials({
    username
  });

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-muted animate-pulse rounded-full`} />
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} border-2 border-kick-green/30 ${className}`}>
      <AvatarImage 
        src={avatarUrl || undefined}
        alt={username}
        onError={(e) => {
          e.currentTarget.src = '/placeholder-avatar.jpg';
        }}
      />
      <AvatarFallback className="bg-kick-green text-kick-dark font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}