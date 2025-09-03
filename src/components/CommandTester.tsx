import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageSquare, Bot } from "lucide-react";

interface KickUser {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  authenticated: boolean;
}

export function CommandTester() {
  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;

    setSending(true);
    try {
      // Get Kick user data and tokens
      const kickUserData = localStorage.getItem('kick_user');
      const kickTokenData = localStorage.getItem('kick_token');
      
      if (!kickUserData) {
        toast({
          title: "Error",
          description: "Please link your Kick account first",
          variant: "destructive"
        });
        return;
      }

      const kickUser: KickUser = JSON.parse(kickUserData);
      const kickToken = kickTokenData ? JSON.parse(kickTokenData) : null;

      console.log('📤 Sending test message via Kick API:', testMessage);

      const response = await supabase.functions.invoke('kick-chat-api', {
        body: {
          action: 'send_message',
          channel_id: 'test_channel', // You can make this configurable
          message: testMessage,
          token_info: kickToken
        }
      });

      console.log('📥 Response:', response);

      if (response.error) {
        throw response.error;
      }

      if (response.data?.success) {
        toast({
          title: "Message Sent! ✅",
          description: `Successfully sent: "${testMessage}"`,
        });
        setTestMessage("");
      } else {
        throw new Error(response.data?.error || 'Unknown error');
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const kickUserData = localStorage.getItem('kick_user');
  const kickUser = kickUserData ? JSON.parse(kickUserData) : null;
  const isConnected = kickUser?.authenticated;

  return (
    <Card className="gaming-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-kick-green" />
          Chat API Tester
          {isConnected ? (
            <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30">
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Disconnected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>Logged in as @{kickUser.username}</span>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Type a message or command to test..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                className="flex-1"
              />
              <Button 
                onClick={sendTestMessage}
                disabled={sending || !testMessage.trim()}
                size="sm"
                className="gaming-button"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              💡 Try commands like: !help, !discord, !socials
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">
              Connect your Kick account to test chat commands
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              variant="outline"
              size="sm"
            >
              Connect Kick Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}