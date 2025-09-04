import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export function useFeatureAccess() {
  const { user } = useAuth();
  const [featureAccess, setFeatureAccess] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkFeatureAccess();
    } else {
      setFeatureAccess({});
      setLoading(false);
    }
  }, [user]);

  const checkFeatureAccess = async () => {
    if (!user) return;

    try {
      // Get all available features
      const { data: features, error: featuresError } = await supabase
        .from('feature_permissions')
        .select('feature_name');

      if (featuresError) throw featuresError;

      // Check access for each feature
      const accessChecks = await Promise.all(
        features?.map(async (feature) => {
          const { data, error } = await supabase
            .rpc('has_feature_access', { 
              _user_id: user.id, 
              _feature_name: feature.feature_name 
            });

          if (error) {
            console.error(`Error checking access for ${feature.feature_name}:`, error);
            return { feature: feature.feature_name, hasAccess: false };
          }

          return { feature: feature.feature_name, hasAccess: data || false };
        }) || []
      );

      const accessMap = accessChecks.reduce((acc, { feature, hasAccess }) => {
        acc[feature] = hasAccess;
        return acc;
      }, {} as Record<string, boolean>);

      setFeatureAccess(accessMap);
    } catch (error) {
      console.error('Error checking feature access:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (featureName: string): boolean => {
    return featureAccess[featureName] || false;
  };

  return {
    featureAccess,
    hasAccess,
    loading,
    refetch: checkFeatureAccess
  };
}