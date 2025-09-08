import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Gift } from 'lucide-react';

interface BonusHuntSession {
  id: string;
  session_name?: string;
  starting_balance: number;
  current_balance: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  bonus_opening_phase?: boolean;
}

export default function BonusHuntSimple() {
  console.log('🔧 BonusHuntSimple component rendering...');
  
  const { user, loading: authLoading } = useAuth();
  const [activeSession, setActiveSession] = useState<BonusHuntSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🔧 BonusHuntSimple state:', { user: !!user, authLoading, loading, error });

  useEffect(() => {
    if (user) {
      loadActiveSession();
    }
  }, [user]);

  const loadActiveSession = async () => {
    try {
      console.log('🔧 Loading active session...');
      const { data, error } = await supabase
        .from('bonus_hunt_sessions')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setActiveSession(data as BonusHuntSession | null);
      console.log('🔧 Active session loaded:', data);
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  console.log('🔧 BonusHuntSimple render check:', { authLoading, loading, user: !!user });

  if (authLoading) {
    console.log('🔧 Showing auth loading...');
    return <div className="flex items-center justify-center h-64">Checking authentication...</div>;
  }

  if (!user) {
    console.log('🔧 No user, showing auth message...');
    return <div className="flex items-center justify-center h-64">Please log in to access Bonus Hunt</div>;
  }

  if (loading) {
    console.log('🔧 Showing loading...');
    return <div className="flex items-center justify-center h-64">Loading bonus hunt...</div>;
  }

  if (error) {
    console.log('🔧 Showing error:', error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={loadActiveSession} className="mt-2">Retry</Button>
        </div>
      </div>
    );
  }

  console.log('🔧 Rendering main content...');

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bonus Hunt</h1>
      </div>

      {activeSession ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {activeSession.session_name || 'Active Bonus Hunt'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Starting Balance</p>
                <p className="text-lg font-semibold">${activeSession.starting_balance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-lg font-semibold">${activeSession.current_balance.toFixed(2)}</p>
              </div>
            </div>
            {activeSession.bonus_opening_phase && (
              <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <p className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Bonus opening phase active
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No active bonus hunt session</p>
            <Button>Start New Hunt</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            This is a simplified version to test the basic functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}