import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  MessageSquare,
  Zap,
  Settings,
  Copy
} from "lucide-react";

const commands = [
  {
    id: 1,
    command: "!discord",
    response: "Join our Discord server: https://discord.gg/example",
    uses: 1247,
    enabled: true,
    cooldown: 30,
    userLevel: "everyone"
  },
  {
    id: 2,
    command: "!socials",
    response: "Follow me on Twitter: @streamer | Instagram: @streamer_ig",
    uses: 892,
    enabled: true,
    cooldown: 60,
    userLevel: "everyone"
  },
  {
    id: 3,
    command: "!giveaway",
    response: "Current giveaway: Gaming Headset! Type !enter to join!",
    uses: 456,
    enabled: true,
    cooldown: 10,
    userLevel: "everyone"
  },
  {
    id: 4,
    command: "!help",
    response: "Available commands: !discord, !socials, !giveaway, !enter",
    uses: 324,
    enabled: true,
    cooldown: 30,
    userLevel: "everyone"
  },
  {
    id: 5,
    command: "!mod",
    response: "Moderator-only command executed successfully!",
    uses: 89,
    enabled: true,
    cooldown: 0,
    userLevel: "moderator"
  }
];

export default function Commands() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredCommands = commands.filter(cmd =>
    cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.response.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserLevelColor = (level: string) => {
    switch (level) {
      case "everyone": return "bg-kick-green/20 text-kick-green border-kick-green/30";
      case "moderator": return "bg-kick-purple/20 text-kick-purple border-kick-purple/30";
      case "subscriber": return "bg-accent/20 text-accent border-accent/30";
      default: return "bg-secondary/20 text-secondary-foreground border-secondary/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commands</h1>
          <p className="text-muted-foreground mt-1">
            Manage your bot's chat commands and responses.
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gaming-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Command
            </Button>
          </DialogTrigger>
          <DialogContent className="gaming-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Command</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="command">Command</Label>
                <Input id="command" placeholder="!example" className="bg-secondary/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Response</Label>
                <Textarea id="response" placeholder="Enter the bot's response..." className="bg-secondary/30" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                  <Input id="cooldown" type="number" placeholder="30" className="bg-secondary/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userLevel">User Level</Label>
                  <select className="w-full p-2 rounded-md bg-secondary/30 border border-border text-foreground">
                    <option value="everyone">Everyone</option>
                    <option value="subscriber">Subscribers</option>
                    <option value="moderator">Moderators</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="enabled" />
                <Label htmlFor="enabled">Enable command</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="gaming-button flex-1">Create Command</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="gaming-card">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/30"
              />
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              {filteredCommands.length} commands
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Commands List */}
      <div className="grid gap-4">
        {filteredCommands.map((command) => (
          <Card key={command.id} className="gaming-card hover:scale-[1.02] transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-lg font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {command.command}
                    </code>
                    <Badge className={getUserLevelColor(command.userLevel)}>
                      {command.userLevel}
                    </Badge>
                    {command.enabled ? (
                      <Badge className="bg-kick-green/20 text-kick-green border-kick-green/30">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                    {command.response}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{command.uses} uses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span>{command.cooldown}s cooldown</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCommands.length === 0 && (
        <Card className="gaming-card">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No commands found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "Try adjusting your search terms." : "Get started by creating your first command."}
            </p>
            <Button className="gaming-button" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Command
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}