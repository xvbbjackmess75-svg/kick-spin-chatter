import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useKickAccount } from "@/hooks/useKickAccount";
import { Bot, Play, Square, MessageCircle, Zap } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  username: string;
  userId: string;
  timestamp: string;
  chatroomId: string;
}

interface CommandProcessed {
  command: string;
  response: string;
  user: string;
}

export function ChatBot() {
  const { toast } = useToast();
  const { kickUser, kickToken, canUseChatbot, getChannelInfo } = useKickAccount();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [commandsProcessed, setCommandsProcessed] = useState<CommandProcessed[]>([]);
  const [wsStatus, setWsStatus] = useState<string>("Disconnected");
  
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToChatbot = async () => {
    if (!canUseChatbot || !kickUser || !kickToken) {
      toast({
        title: "Error",
        description: "Kick account not properly linked",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setWsStatus("Connecting...");

    try {
      // Connect to the WebSocket chat monitor
      const wsUrl = `wss://xdjtgkgwtsdpfftrrouz.supabase.co/functions/v1/kick-chat-monitor`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("🤖 Connected to chat monitor WebSocket");
        setWsStatus("Connected");
        
        // Join the channel with bot token
        socket.send(JSON.stringify({
          type: 'join_channel',
          channelName: kickUser.username,
          token: kickToken.access_token
        }));
        
        socketRef.current = socket;
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📥 Received from chat monitor:", data);

        switch (data.type) {
          case 'connected':
            setIsConnected(true);
            setIsConnecting(false);
            setWsStatus(`Monitoring @${data.channelName}`);
            toast({
              title: "🤖 ChatBot Active!",
              description: `Now monitoring chat in @${data.channelName}`,
            });
            break;

          case 'chat_message':
            setMessages(prev => [...prev.slice(-49), data.data]); // Keep last 50 messages
            break;

          case 'command_processed':
            setCommandsProcessed(prev => [...prev.slice(-9), data]); // Keep last 10 commands
            toast({
              title: "⚡ Command Processed",
              description: `!${data.command} from @${data.user}`,
            });
            break;

          case 'error':
            toast({
              title: "ChatBot Error",
              description: data.message,
              variant: "destructive"
            });
            break;

          case 'disconnected':
            setIsConnected(false);
            setWsStatus("Disconnected");
            break;
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setIsConnecting(false);
        setWsStatus("Error");
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat monitor",
          variant: "destructive"
        });
      };

      socket.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setIsConnected(false);
        setIsConnecting(false);
        setWsStatus("Disconnected");
        socketRef.current = null;
      };

    } catch (error: any) {
      console.error("❌ Error connecting to chatbot:", error);
      setIsConnecting(false);
      setWsStatus("Error");
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to start chatbot",
        variant: "destructive"
      });
    }
  };

  const disconnectChatbot = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setWsStatus("Disconnected");
    toast({
      title: "ChatBot Stopped",
      description: "Chat monitoring has been stopped",
    });
  };

  if (!canUseChatbot) {
    return (
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-kick-green" />
            ChatBot Monitor
            <Badge variant="secondary">Disconnected</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          <p className="text-muted-foreground mb-2">
            Connect your Kick account to enable the chatbot
          </p>
          <Button 
            onClick={() => window.location.href = '/auth'}
            variant="outline"
            size="sm"
          >
            Connect Kick Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-kick-green" />
            ChatBot Monitor
            <Badge 
              className={
                isConnected 
                  ? "bg-kick-green/20 text-kick-green border-kick-green/30"
                  : "bg-destructive/20 text-destructive border-destructive/30"
              }
            >
              {wsStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>Channel: @{kickUser?.username}</span>
            </div>
            
            <div className="flex gap-2">
              {!isConnected && !isConnecting && (
                <Button 
                  onClick={connectToChatbot}
                  size="sm"
                  className="gaming-button"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start ChatBot
                </Button>
              )}
              
              {isConnecting && (
                <Button disabled size="sm">
                  Connecting...
                </Button>
              )}
              
              {isConnected && (
                <Button 
                  onClick={disconnectChatbot}
                  size="sm"
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop ChatBot
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Chat Feed */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chat Messages */}
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="text-sm">Live Chat Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className="text-xs p-2 rounded border-l-2 border-accent">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-primary">{message.username}</span>
                        <span className="text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-foreground">{message.content}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Commands Processed */}
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-kick-green" />
                Commands Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {commandsProcessed.map((cmd, index) => (
                    <div key={index} className="text-xs p-2 rounded border-l-2 border-kick-green">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-kick-green">!{cmd.command}</span>
                        <span className="text-muted-foreground">by @{cmd.user}</span>
                      </div>
                      <p className="text-foreground">→ {cmd.response}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}