import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

// Create a hybrid user ID that works for both Supabase and Kick users
export function useHybridAuth() {
  const { user } = useAuth();
  const [hybridUserId, setHybridUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineUserId = () => {
      // First priority: Supabase authenticated user
      if (user) {
        setHybridUserId(user.id);
        setLoading(false);
        return;
      }

      // Second priority: Kick authenticated user
      const kickUserData = localStorage.getItem('kick_user');
      if (kickUserData) {
        try {
          const kickUser = JSON.parse(kickUserData);
          if (kickUser.authenticated) {
            // Use a consistent ID format for Kick users
            setHybridUserId(`kick_${kickUser.id}`);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing Kick user data:', error);
        }
      }

      // No authentication found
      setHybridUserId(null);
      setLoading(false);
    };

    determineUserId();
  }, [user]);

  const isAuthenticated = !!hybridUserId;
  const isKickUser = hybridUserId?.startsWith('kick_') || false;
  const isSupabaseUser = !!user;

  return {
    hybridUserId,
    isAuthenticated,
    isKickUser,
    isSupabaseUser,
    loading,
    user
  };
}