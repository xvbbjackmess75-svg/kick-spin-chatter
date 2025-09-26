import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useKickAccount } from '@/hooks/useKickAccount';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MonitorStatus {
  id: string;
  is_active: boolean;
  is_connected?: boolean; // Add this optional property
  kick_username: string;
  total_messages_processed: number;
  total_commands_processed: number;
  last_heartbeat: string;
  started_at: string;
}

export function useAutoMonitor() {
  const { user } = useAuth();
  const { kickUser, kickToken, canUseChatbot } = useKickAccount();
  const { toast } = useToast();
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check monitoring status periodically to ensure persistence
  useEffect(() => {
    if (!user) return;

    // Check status immediately
    checkMonitoringStatus();

    // Set up periodic status checks every 10 seconds
    const interval = setInterval(() => {
      checkMonitoringStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // Add a separate effect to handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Page is now visible, refresh status immediately
        setTimeout(() => checkMonitoringStatus(), 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const startAutoMonitoring = async () => {
    if (!user) {
      console.error('❌ No user found for monitoring');
      return;
    }

    try {
      console.log('🤖 Starting auto-monitoring for user:', kickUser?.username);

      const response = await supabase.functions.invoke('kick-auto-monitor', {
        body: {
          action: 'start_monitoring',
          user_id: user.id,
          token_info: kickToken || {} // Pass empty object if no kickToken
        }
      });

      console.log('✅ Start monitoring response:', response);

      if (response.error) {
        console.error('❌ Edge function error:', response.error);
        throw response.error;
      }

      if (response.data?.success) {
        toast({
          title: "🤖 ChatBot Started!",
          description: `Now monitoring for slots commands`,
        });
        
        // Wait a moment then check status multiple times to ensure we get updated status
        setTimeout(() => {
          checkMonitoringStatus();
        }, 1000);
        setTimeout(() => {
          checkMonitoringStatus();
        }, 3000);
        setTimeout(() => {
          checkMonitoringStatus();
        }, 5000);
      } else {
        console.error('❌ Monitoring failed:', response.data);
        throw new Error(response.data?.error || 'Failed to start monitoring');
      }

    } catch (error: any) {
      console.error('❌ Failed to start auto-monitoring:', error);
      toast({
        title: "Auto-Monitor Failed",
        description: error.message || "Failed to start automatic monitoring",
        variant: "destructive"
      });
    }
  };

  const checkMonitoringStatus = async () => {
    if (!user) return;

    try {
      const response = await supabase.functions.invoke('kick-auto-monitor', {
        body: {
          action: 'get_status',
          user_id: user.id
        }
      });

      if (response.data?.success && response.data.monitor) {
        // Merge the monitor data with is_connected status
        setMonitorStatus({
          ...response.data.monitor,
          is_connected: response.data.is_connected
        });
      } else {
        setMonitorStatus(null);
      }

    } catch (error: any) {
      console.error('❌ Failed to check monitoring status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBotMessage = async (message: string) => {
    if (!user || !kickToken?.access_token) {
      console.error('❌ Cannot send message: missing user or token');
      toast({
        title: "Cannot Send Message",
        description: "Please make sure you're logged in and have connected your Kick account",
        variant: "destructive"
      });
      return false;
    }

    try {
      const response = await supabase.functions.invoke('kick-auto-monitor', {
        body: {
          action: 'send_message',
          user_id: user.id,
          message: message,
          token: kickToken.access_token
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Edge function returned an error');
      }

      if (response.data?.success) {
        toast({
          title: "Message Sent",
          description: `Bot message sent successfully`,
        });
        return true;
      } else {
        throw new Error(response.data?.error || 'Unknown error from edge function');
      }

    } catch (error: any) {
      console.error('❌ Failed to send bot message:', error);
      toast({
        title: "Failed to Send Message",
        description: error.message || "Failed to send bot message",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendHeartbeat = async () => {
    if (!user || !monitorStatus?.is_active) return;

    try {
      await supabase.functions.invoke('kick-auto-monitor', {
        body: {
          action: 'heartbeat',
          user_id: user.id
        }
      });
    } catch (error) {
      console.error('❌ Heartbeat failed:', error);
    }
  };

  // Heartbeat disabled for manual monitoring

  return {
    monitorStatus,
    isLoading,
    isActive: monitorStatus?.is_active || false,
    isConnected: monitorStatus?.is_connected || false,
    canUseChatbot,
    startAutoMonitoring,
    sendBotMessage,
    checkMonitoringStatus
  };
}