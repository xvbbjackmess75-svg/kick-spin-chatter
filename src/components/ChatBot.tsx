import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useKickAccount } from "@/hooks/useKickAccount";
import { useAutoMonitor } from "@/hooks/useAutoMonitor";
import { Bot, Play, Square, MessageCircle, Zap, Clock, TrendingUp, Settings } from "lucide-react";

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
  const { kickUser, canUseChatbot } = useKickAccount();
  const { monitorStatus, isLoading, isActive, stopMonitoring } = useAutoMonitor();

  const getUptime = () => {
    if (!monitorStatus?.started_at) return "0m";
    
    const now = new Date();
    const started = new Date(monitorStatus.started_at);
    const diff = now.getTime() - started.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getLastActivity = () => {
    if (!monitorStatus?.last_heartbeat) return "Never";
    
    const now = new Date();
    const lastHeartbeat = new Date(monitorStatus.last_heartbeat);
    const diff = now.getTime() - lastHeartbeat.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!canUseChatbot) {
    return (
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-kick-green" />
            Auto ChatBot Monitor
            <Badge variant="secondary">Not Available</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          <p className="text-muted-foreground mb-2">
            Connect your Kick account to enable automatic chatbot monitoring
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

  if (isLoading) {
    return (
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-kick-green" />
            Auto ChatBot Monitor
            <Badge variant="secondary">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          <p className="text-muted-foreground">Checking monitor status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Always-On Status Panel */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-kick-green" />
            Auto ChatBot Monitor
            <Badge 
              className={
                isActive 
                  ? "bg-kick-green/20 text-kick-green border-kick-green/30"
                  : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
              }
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-kick-green animate-pulse' : 'bg-yellow-500'}`} />
              {isActive ? "Always On" : "Starting..."}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Channel Info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
              <div>
                <p className="text-sm text-muted-foreground">Monitoring Channel</p>
                <p className="text-lg font-semibold text-foreground">
                  @{kickUser?.username}
                </p>
              </div>
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            
            {/* Uptime */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-semibold text-foreground">{getUptime()}</p>
              </div>
              <Clock className="h-8 w-8 text-accent" />
            </div>
            
            {/* Last Activity */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
              <div>
                <p className="text-sm text-muted-foreground">Last Activity</p>
                <p className="text-lg font-semibold text-foreground">{getLastActivity()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-kick-green" />
            </div>
          </div>

          {/* Statistics */}
          {monitorStatus && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Messages Processed</p>
                    <p className="text-2xl font-bold text-primary">{monitorStatus.total_messages_processed.toLocaleString()}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-kick-green/5 border border-kick-green/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commands Executed</p>
                    <p className="text-2xl font-bold text-kick-green">{monitorStatus.total_commands_processed.toLocaleString()}</p>
                  </div>
                  <Zap className="h-8 w-8 text-kick-green" />
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              🤖 <strong>Always-On Mode:</strong> The chatbot automatically monitors your chat and responds to commands 24/7. No manual intervention required!
            </div>
            
            <div className="flex gap-2">
              {isActive && (
                <Button 
                  onClick={stopMonitoring}
                  size="sm"
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Disable Auto-Monitor
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Panel */}
      <Card className="gaming-card border-kick-green/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-kick-green mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Automatic ChatBot Features</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• <strong>24/7 Monitoring:</strong> Automatically started when you link your Kick account</li>
                <li>• <strong>Instant Responses:</strong> Commands are processed immediately without delays</li>
                <li>• <strong>Permission System:</strong> Respects viewer, subscriber, moderator, and owner levels</li>
                <li>• <strong>Background Processing:</strong> Runs continuously without affecting your stream</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}