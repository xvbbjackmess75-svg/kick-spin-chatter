import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin';

// Helper to determine access levels
export const isViewerRole = (role: UserRole): boolean => {
  return ['viewer', 'verified_viewer'].includes(role);
};

export const canAccessStreamerPanel = (role: UserRole): boolean => {
  return ['streamer', 'user', 'premium', 'vip_plus', 'admin'].includes(role);
};

export const canAccessAdminPanel = (role: UserRole): boolean => {
  return role === 'admin';
};

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole('viewer');
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (error) throw error;
      setRole(data || 'viewer'); // Default to viewer instead of user
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('viewer');
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy = { viewer: 0, verified_viewer: 1, streamer: 2, user: 3, premium: 4, vip_plus: 5, admin: 6 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = (): boolean => role === 'admin';
  const shouldUseViewerPortal = (): boolean => isViewerRole(role);
  const hasStreamerAccess = (): boolean => canAccessStreamerPanel(role);
  const hasAdminAccess = (): boolean => canAccessAdminPanel(role);

  return {
    role,
    loading,
    hasRole,
    isAdmin,
    shouldUseViewerPortal,
    hasStreamerAccess,
    hasAdminAccess,
    refetch: fetchUserRole
  };
}