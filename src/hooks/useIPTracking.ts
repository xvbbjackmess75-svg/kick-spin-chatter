import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export function useIPTracking() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      trackUserIP();
    }
  }, [user]);

  // Also track on page navigation
  useEffect(() => {
    const handleNavigation = () => {
      if (user) {
        trackUserIP();
      }
    };

    // Track on page focus (user returns to tab)
    window.addEventListener('focus', handleNavigation);
    
    return () => {
      window.removeEventListener('focus', handleNavigation);
    };
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