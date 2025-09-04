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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      username: "StreamBot",
      message: "🤖 Bot is now online and ready!",
      timestamp: "14:23:30",
      userType: "moderator",
      avatar: "/bot-avatar.jpg",
      isBot: true
    },
    {
      id: 2,
      username: "StreamFan99",
      message: "!enter",
      timestamp: "14:23:15",
      userType: "viewer",
      avatar: "/avatar1.jpg",
      isCommand: true
    },
    {
      id: 3,
      username: "ModeratorMax",
      message: "Welcome everyone to the stream! 🎮",
      timestamp: "14:23:10",
      userType: "moderator",
      avatar: "/avatar2.jpg"
    },
    {
      id: 4,
      username: "GamingQueen",
      message: "Love this game! ❤️ First time watching",
      timestamp: "14:23:05",
      userType: "subscriber",
      avatar: "/avatar3.jpg"
    },
    {
      id: 5,
      username: "BotLover",
      message: "!discord",
      timestamp: "14:22:58",
      userType: "viewer",
      avatar: "/avatar4.jpg",
      isCommand: true
    }
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate new messages
  useEffect(() => {
    const interval = setInterval(() => {
      const sampleMessages = [
        "This stream is amazing! 🔥",
        "!help",
        "First time here, loving it!",
        "!giveaway",
        "GG that was insane",
        "What game is this?",
        "!enter",
        "Sub hype! 💜",
        "!discord",
        "Can't wait for the next stream!"
      ];
      
      const sampleUsers = [
        { name: "ChatMaster", type: "viewer" as const, avatar: "/avatar5.jpg" },
        { name: "ProGamer2023", type: "subscriber" as const, avatar: "/avatar6.jpg" },
        { name: "StreamLover", type: "viewer" as const, avatar: "/avatar7.jpg" },
        { name: "NightOwl99", type: "subscriber" as const, avatar: "/avatar8.jpg" },
        { name: "GameFan", type: "viewer" as const, avatar: "/avatar9.jpg" }
      ];

      const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
      const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newMessage: ChatMessage = {
        id: Date.now(),
        username: randomUser.name,
        message: randomMessage,
        timestamp,
        userType: randomUser.type,
        avatar: randomUser.avatar,
        isCommand: randomMessage.startsWith('!')
      };

      setMessages(prev => [...prev.slice(-19), newMessage]); // Keep last 20 messages
    }, 3000 + Math.random() * 4000); // Random interval between 3-7 seconds

    return () => clearInterval(interval);
  }, []);

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
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const message: ChatMessage = {
        id: Date.now(),
        username: kickUser?.username || "Bot",
        message: newMessage,
        timestamp,
        userType: "moderator",
        avatar: "/bot-avatar.jpg",
        isBot: true
      };

      setMessages(prev => [...prev, message]);
      setNewMessage("");
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
          Live Chat
          <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30 ml-auto">
            <div className="w-2 h-2 bg-kick-green rounded-full mr-2 animate-pulse" />
            Live
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
            <span className="text-sm font-medium text-foreground">Send as Bot</span>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">@{kickUser?.username}</Badge>
          </div>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a bot message to send to chat..."
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
              Messages sent through your Kick bot • {messages.length} total messages
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}