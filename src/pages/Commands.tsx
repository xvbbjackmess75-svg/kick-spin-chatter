import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKickAccount } from "@/hooks/useKickAccount";
import { KickAccountGuard } from "@/components/KickAccountGuard";
import { CommandTester } from "@/components/CommandTester";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  MessageSquare,
  Zap,
  Settings,
  Copy,
  Play,
  Loader2
} from "lucide-react";

interface Command {
  id: string;
  command: string;
  response: string;
  uses: number;
  enabled: boolean;
  cooldown: number;
  user_level: string;
  user_id: string;
  created_at: string;
}

interface KickUser {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  authenticated: boolean;
}

export default function Commands() {
  const { user } = useAuth();
  const { kickUser, kickToken, canUseChatbot, getChannelInfo } = useKickAccount();
  const { toast } = useToast();
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [testingCommand, setTestingCommand] = useState<string | null>(null);
  
  // Form states
  const [newCommand, setNewCommand] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newCooldown, setNewCooldown] = useState(30);
  const [newUserLevel, setNewUserLevel] = useState("everyone");
  const [newEnabled, setNewEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommands();
    }
  }, [user]);

  const fetchCommands = async () => {
    try {
      const { data, error } = await supabase
        .from('commands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommands(data || []);
    } catch (error) {
      console.error('Error fetching commands:', error);
      toast({
        title: "Error",
        description: "Failed to load commands",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCommand = async () => {
    if (!newCommand.trim() || !newResponse.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Ensure command starts with !
    const commandText = newCommand.startsWith('!') ? newCommand : `!${newCommand}`;

    try {
      const { data, error } = await supabase
        .from('commands')
        .insert({
          command: commandText,
          response: newResponse,
          cooldown: newCooldown,
          user_level: newUserLevel,
          enabled: newEnabled,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Command ${commandText} created successfully!`
      });

      setCommands([data, ...commands]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating command:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create command",
        variant: "destructive"
      });
    }
  };

  const testCommand = async (command: Command) => {
    setTestingCommand(command.id);
    
    try {
      const channelInfo = getChannelInfo();
      
      if (!channelInfo || !kickToken) {
        toast({
          title: "Error",
          description: "Kick account not properly linked",
          variant: "destructive"
        });
        return;
      }

      // Test the command processing on the user's own channel
      const response = await supabase.functions.invoke('kick-chat-api', {
        body: {
          action: 'process_command',
          command: command.command,
          user: {
            username: kickUser?.username || 'test_user',
            user_id: kickUser?.id?.toString() || 'test_id',
            user_level: 'owner' // Test as owner since it's their own channel
          },
          channel_id: channelInfo.channelId,
          token_info: kickToken
        }
      });

      console.log('Test command response:', response);

      if (response.error) {
        throw response.error;
      }

      if (response.data?.success) {
        toast({
          title: "Command Test Successful! ✅",
          description: `Response: "${response.data.response || command.response}"`,
        });
      } else {
        throw new Error(response.data?.error || 'Unknown error');
      }

    } catch (error: any) {
      console.error('Error testing command:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test command",
        variant: "destructive"
      });
    } finally {
      setTestingCommand(null);
    }
  };

  const deleteCommand = async (commandId: string) => {
    try {
      const { error } = await supabase
        .from('commands')
        .delete()
        .eq('id', commandId);

      if (error) throw error;

      setCommands(commands.filter(cmd => cmd.id !== commandId));
      toast({
        title: "Success",
        description: "Command deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting command:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete command",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewCommand("");
    setNewResponse("");
    setNewCooldown(30);
    setNewUserLevel("everyone");
    setNewEnabled(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading commands...</p>
        </div>
      </div>
    );
  }

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
    <KickAccountGuard 
      feature="Chat Commands" 
      description="Create and manage custom chat commands that respond automatically to your viewers. Commands work in real-time on your Kick channel."
    >
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
                <Input 
                  id="command" 
                  placeholder="!example" 
                  className="bg-secondary/30" 
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Response</Label>
                <Textarea 
                  id="response" 
                  placeholder="Enter the bot's response..." 
                  className="bg-secondary/30" 
                  rows={3}
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                  <Input 
                    id="cooldown" 
                    type="number" 
                    placeholder="30" 
                    className="bg-secondary/30"
                    value={newCooldown}
                    onChange={(e) => setNewCooldown(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userLevel">User Level</Label>
                  <select 
                    className="w-full p-2 rounded-md bg-secondary/30 border border-border text-foreground"
                    value={newUserLevel}
                    onChange={(e) => setNewUserLevel(e.target.value)}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="subscriber">Subscribers</option>
                    <option value="moderator">Moderators</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enabled" 
                  checked={newEnabled}
                  onCheckedChange={setNewEnabled}
                />
                <Label htmlFor="enabled">Enable command</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="gaming-button flex-1" onClick={createCommand}>
                  Create Command
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Command Tester */}
      <CommandTester />

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
                    <Badge className={getUserLevelColor(command.user_level)}>
                      {command.user_level}
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
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-kick-green hover:text-kick-green hover:bg-kick-green/10"
                    onClick={() => testCommand(command)}
                    disabled={testingCommand === command.id}
                  >
                    {testingCommand === command.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigator.clipboard.writeText(command.command)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteCommand(command.id)}
                  >
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
    </KickAccountGuard>
  );
}