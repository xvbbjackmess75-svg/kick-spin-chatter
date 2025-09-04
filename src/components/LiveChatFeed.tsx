import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAutoMonitor } from "@/hooks/useAutoMonitor";
import { useKickAccount } from "@/hooks/useKickAccount";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send,
  Smile,
  Gift,
  Crown,
  Shield,
  Heart,
  Bot
} from "lucide-react";

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  userType: "viewer" | "subscriber" | "moderator";
  avatar: string;
  isCommand?: boolean;
  isBot?: boolean;
}

export function LiveChatFeed() {
  const { toast } = useToast();
  const { kickUser } = useKickAccount();
  const { sendBotMessage } = useAutoMonitor();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to real Kick chat
  useEffect(() => {
    if (!kickUser?.username) return;

    const connectToKickChat = async () => {
      try {
        // Get channel info to find chatroom ID
        const channelResponse = await fetch(`https://kick.com/api/v2/channels/${kickUser.username}`);
        
        if (!channelResponse.ok) {
          throw new Error(`Channel not found: ${kickUser.username}`);
        }

        const channelData = await channelResponse.json();
        const chatroomId = channelData.chatroom?.id;

        if (!chatroomId) {
          throw new Error(`No chatroom found for channel: ${kickUser.username}`);
        }

        console.log(`📡 Connecting to chatroom ${chatroomId} for @${kickUser.username}`);

        // Connect to Kick's Pusher WebSocket
        const pusherUrl = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";
        const kickSocket = new WebSocket(pusherUrl);
        wsRef.current = kickSocket;

        kickSocket.onopen = () => {
          console.log(`✅ Connected to Kick WebSocket for @${kickUser.username}`);
          setIsConnected(true);
          
          // Subscribe to the chatroom channel
          const subscribeMessage = {
            event: "pusher:subscribe",
            data: {
              channel: `chatrooms.${chatroomId}.v2`
            }
          };
          
          kickSocket.send(JSON.stringify(subscribeMessage));
        };

        kickSocket.onmessage = (event) => {
          try {
            const pusherData = JSON.parse(event.data);

            // Handle chat messages
            if (pusherData.event === 'App\\Events\\ChatMessageEvent') {
              const messageData = JSON.parse(pusherData.data);
              
              const chatMessage: ChatMessage = {
                id: messageData.id || Date.now(),
                username: messageData.sender?.username || 'Unknown',
                message: messageData.content || '',
                timestamp: new Date().toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }),
                userType: getUserTypeFromBadges(messageData.sender?.identity?.badges || []),
                avatar: messageData.sender?.identity?.avatar || `/avatar${Math.floor(Math.random() * 9) + 1}.jpg`,
                isCommand: messageData.content?.startsWith('!') || false,
                isBot: messageData.sender?.username?.toLowerCase().includes('bot') || false
              };

              setMessages(prev => [...prev.slice(-19), chatMessage]); // Keep last 20 messages
            }
          } catch (error) {
            console.error("❌ Error processing chat message:", error);
          }
        };

        kickSocket.onerror = (error) => {
          console.error(`❌ WebSocket error for @${kickUser.username}:`, error);
          setIsConnected(false);
        };

        kickSocket.onclose = () => {
          console.log(`🔌 WebSocket disconnected for @${kickUser.username}`);
          setIsConnected(false);
        };

      } catch (error) {
        console.error(`❌ Error connecting to Kick chat:`, error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to Kick chat. Please try again.",
          variant: "destructive"
        });
      }
    };

    connectToKickChat();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [kickUser?.username]);

  // Helper function to determine user type from badges
  const getUserTypeFromBadges = (badges: any[]): "viewer" | "subscriber" | "moderator" => {
    if (badges?.some((badge: any) => badge.type === 'broadcaster' || badge.type === 'moderator')) {
      return 'moderator';
    }
    if (badges?.some((badge: any) => badge.type === 'subscriber')) {
      return 'subscriber';
    }
    return 'viewer';
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (isAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScroll]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const success = await sendBotMessage(newMessage);
    
    if (success) {
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Bot message sent to Kick chat successfully",
      });
    }
  };

  const getUserTypeIcon = (userType: string, isBot?: boolean) => {
    if (isBot) return <div className="w-3 h-3 bg-primary rounded-full" />;
    
    switch (userType) {
      case "moderator": return <Shield className="h-3 w-3 text-kick-purple" />;
      case "subscriber": return <Crown className="h-3 w-3 text-accent" />;
      default: return null;
    }
  };

  const getUserTypeBadge = (userType: string, isBot?: boolean) => {
    if (isBot) return "bg-primary/20 text-primary border-primary/30";
    
    switch (userType) {
      case "moderator": return "bg-kick-purple/20 text-kick-purple border-kick-purple/30";
      case "subscriber": return "bg-accent/20 text-accent border-accent/30";
      default: return "";
    }
  };

  return (
    <Card className="gaming-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Live Kick Chat - @{kickUser?.username}
          <Badge className={isConnected ? "bg-kick-green/20 text-kick-green border-kick-green/30 ml-auto" : "bg-red-500/20 text-red-500 border-red-500/30 ml-auto"}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-kick-green animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-[500px]">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-3 transition-all duration-200 chat-message ${
                  message.isCommand ? 'bg-primary/5 -mx-2 px-2 py-2 rounded-lg border-l-2 border-primary' : ''
                } ${message.isBot ? 'bg-secondary/30 -mx-2 px-2 py-2 rounded-lg' : ''}`}
              >
                <Avatar className="h-7 w-7 mt-0.5">
                  <AvatarImage src={message.avatar} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {message.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm truncate">
                      {message.username}
                    </span>
                    {getUserTypeIcon(message.userType, message.isBot)}
                    {(message.userType !== "viewer" || message.isBot) && (
                      <Badge className={`text-xs ${getUserTypeBadge(message.userType, message.isBot)}`}>
                        {message.isBot ? "BOT" : message.userType}
                      </Badge>
                    )}
                    {message.isCommand && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        <Gift className="h-2 w-2 mr-1" />
                        CMD
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className={`text-sm break-words ${
                    message.isCommand ? 'font-mono text-primary' : 
                    message.isBot ? 'text-foreground font-medium' : 'text-foreground'
                  }`}>
                    {message.message}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Bot Message Input */}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Send as Kick Bot</span>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Bot Account</Badge>
          </div>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message to send from your Kick bot..."
              className="bg-secondary/30 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              className="gaming-button"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs text-muted-foreground">
              Messages sent from your connected Kick bot account • {messages.length} messages loaded
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}