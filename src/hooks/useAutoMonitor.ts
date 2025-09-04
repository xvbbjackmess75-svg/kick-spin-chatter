import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useKickAccount } from '@/hooks/useKickAccount';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MonitorStatus {
  id: string;
  is_active: boolean;
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

  // Auto-start monitoring when conditions are met
  useEffect(() => {
    if (canUseChatbot && user && kickUser && kickToken) {
      startAutoMonitoring();
    }
  }, [canUseChatbot, user, kickUser, kickToken]);

  // Check status periodically
  useEffect(() => {
    if (user) {
      checkMonitoringStatus();
      const interval = setInterval(checkMonitoringStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const startAutoMonitoring = async () => {
    if (!user || !kickToken) return;

    try {
      console.log('🤖 Starting auto-monitoring for user:', kickUser?.username);

      const response = await supabase.functions.invoke('kick-auto-monitor', {
        body: {
          action: 'start_monitoring',
          user_id: user.id,
          token_info: kickToken
        }
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data?.success) {
        toast({
          title: "🤖 ChatBot Auto-Started!",
          description: `Now monitoring @${kickUser?.username} automatically`,
        });
        
        await checkMonitoringStatus();
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
        setMonitorStatus(response.data.monitor);
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

  // Send heartbeat every minute when active
  useEffect(() => {
    if (monitorStatus?.is_active) {
      const heartbeatInterval = setInterval(sendHeartbeat, 60000); // Every minute
      return () => clearInterval(heartbeatInterval);
    }
  }, [monitorStatus?.is_active]);

  return {
    monitorStatus,
    isLoading,
    isActive: monitorStatus?.is_active || false,
    canUseChatbot,
    startAutoMonitoring,
    sendBotMessage,
    checkMonitoringStatus
  };
}