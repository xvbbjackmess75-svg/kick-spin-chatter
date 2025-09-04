import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin';

// Helper to determine if a role should access viewer portal vs admin panel
export const isViewerRole = (role: UserRole): boolean => {
  return ['user', 'verified_viewer'].includes(role);
};

export const isAdminRole = (role: UserRole): boolean => {
  return ['admin', 'premium', 'vip_plus', 'streamer'].includes(role);
};

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole('user');
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (error) throw error;
      setRole(data || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy = { user: 0, premium: 1, vip_plus: 2, verified_viewer: 2, admin: 3 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = (): boolean => role === 'admin';
  const shouldUseViewerPortal = (): boolean => isViewerRole(role);
  const shouldUseAdminPanel = (): boolean => isAdminRole(role);

  return {
    role,
    loading,
    hasRole,
    isAdmin,
    shouldUseViewerPortal,
    shouldUseAdminPanel,
    refetch: fetchUserRole
  };
}