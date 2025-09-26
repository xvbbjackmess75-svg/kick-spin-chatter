import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useIPTracking() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      trackUserIP();
    }
  }, [user]);

  const trackUserIP = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('track-user-ip', {
        body: {
          user_id: user.id
        }
      });

      if (error) {
        console.error('Error tracking IP:', error);
      }
    } catch (error) {
      console.error('Error calling IP tracking function:', error);
    }
  };

  return { trackUserIP };
}