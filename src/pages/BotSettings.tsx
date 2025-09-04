import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChatBot } from "@/components/ChatBot";
import { 
  Bot, 
  Shield, 
  Settings, 
  Key,
  MessageSquare,
  Users,
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap
} from "lucide-react";

export default function BotSettings() {
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoModeration, setAutoModeration] = useState(true);
  const [commandCooldown, setCommandCooldown] = useState(30);
  const [maxMessageLength, setMaxMessageLength] = useState(500);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bot Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your Kick bot's behavior and permissions.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Bot
          </Button>
          <Button className="gaming-button">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Bot Status */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Bot Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
              <div>
                <p className="text-sm text-muted-foreground">Bot Status</p>
                <p className="text-lg font-semibold text-foreground">
                  {botEnabled ? "Online" : "Offline"}
                </p>
              </div>
              <Badge className={botEnabled ? "bg-kick-green/20 text-kick-green border-kick-green/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                <div className={`w-2 h-2 rounded-full mr-2 ${botEnabled ? 'bg-kick-green animate-pulse' : 'bg-destructive'}`} />
                {botEnabled ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-semibold text-foreground">2h 34m</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
              <div>
                <p className="text-sm text-muted-foreground">Commands Processed</p>
                <p className="text-lg font-semibold text-foreground">1,247</p>
              </div>
              <MessageSquare className="h-8 w-8 text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ChatBot Monitor */}
      <ChatBot />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">Enable Bot</Label>
                <p className="text-sm text-muted-foreground">
                  Turn the bot on or off for your stream
                </p>
              </div>
              <Switch
                checked={botEnabled}
                onCheckedChange={setBotEnabled}
              />
            </div>
            
            <Separator className="bg-border/50" />
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Bot Username</Label>
              <Input 
                defaultValue="StreamBot_Pro" 
                className="bg-secondary/30"
                placeholder="Enter bot username"
              />
              <p className="text-sm text-muted-foreground">
                The username that will appear in chat
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Command Prefix</Label>
              <Input 
                defaultValue="!" 
                className="bg-secondary/30"
                placeholder="!"
                maxLength={1}
              />
              <p className="text-sm text-muted-foreground">
                Character that triggers bot commands
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Default Cooldown (seconds)</Label>
              <Input 
                type="number"
                value={commandCooldown}
                onChange={(e) => setCommandCooldown(Number(e.target.value))}
                className="bg-secondary/30"
                min="0"
                max="300"
              />
              <p className="text-sm text-muted-foreground">
                Default cooldown between command uses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Settings */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-kick-purple" />
              Moderation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground font-medium">Auto Moderation</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically moderate chat messages
                </p>
              </div>
              <Switch
                checked={autoModeration}
                onCheckedChange={setAutoModeration}
              />
            </div>
            
            <Separator className="bg-border/50" />
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Max Message Length</Label>
              <Input 
                type="number"
                value={maxMessageLength}
                onChange={(e) => setMaxMessageLength(Number(e.target.value))}
                className="bg-secondary/30"
                min="50"
                max="1000"
              />
              <p className="text-sm text-muted-foreground">
                Maximum characters allowed in a message
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Banned Words</Label>
              <Textarea 
                placeholder="Enter banned words, separated by commas"
                className="bg-secondary/30"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Words that will trigger auto-moderation
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium">Timeout Duration (minutes)</Label>
              <Input 
                type="number"
                defaultValue="5"
                className="bg-secondary/30"
                min="1"
                max="60"
              />
              <p className="text-sm text-muted-foreground">
                How long users are timed out for violations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Permission Settings */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Permission Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                <div>
                  <p className="font-medium text-foreground">Everyone</p>
                  <p className="text-sm text-muted-foreground">All viewers</p>
                </div>
                <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30">
                  Basic Commands
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                <div>
                  <p className="font-medium text-foreground">Subscribers</p>
                  <p className="text-sm text-muted-foreground">Channel subscribers</p>
                </div>
                <Badge className="bg-accent/20 text-accent border-accent/30">
                  Extended Commands
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                <div>
                  <p className="font-medium text-foreground">Moderators</p>
                  <p className="text-sm text-muted-foreground">Channel moderators</p>
                </div>
                <Badge className="bg-kick-purple/20 text-kick-purple border-kick-purple/30">
                  All Commands
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card className="gaming-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-kick-green/10 border border-kick-green/30">
              <CheckCircle className="h-5 w-5 text-kick-green" />
              <div>
                <p className="text-sm font-medium text-foreground">Kick API Connected</p>
                <p className="text-xs text-muted-foreground">Last connected: 2 hours ago</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium">API Rate Limit</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number"
                  defaultValue="10"
                  className="bg-secondary/30"
                  min="1"
                  max="100"
                />
                <span className="text-sm text-muted-foreground">requests/second</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum API requests per second
              </p>
            </div>
            
            <Button variant="outline" className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Test API Connection
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Warning Notice */}
      <Card className="gaming-card border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Important Notice</p>
              <p className="text-sm text-muted-foreground mt-1">
                Changes to bot settings may take up to 30 seconds to take effect. 
                Restart the bot if changes don't apply immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}