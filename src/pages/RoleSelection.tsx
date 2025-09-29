import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Radio, Shield, Star } from 'lucide-react';

export default function RoleSelection() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'streamer' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRoleSelection = async (role: 'viewer' | 'streamer') => {
    if (!user || isLoading) return;

    try {
      setIsLoading(true);
      setSelectedRole(role);

      // Update profile with selected role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          account_type: role,
          initial_role_selected: true,
          verification_status: {
            kick_linked: true,
            discord_linked: false,
            twitter_linked: false
          }
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Assign the appropriate role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: role
        });

      if (roleError && !roleError.message?.includes('duplicate')) {
        throw roleError;
      }

      toast({
        title: 'Account Setup Complete!',
        description: `You're now set up as a ${role}. Welcome to KickHelper!`
      });

      // Navigate to appropriate dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Role selection error:', error);
      toast({
        title: 'Setup Failed',
        description: 'Unable to complete account setup. Please try again.',
        variant: 'destructive'
      });
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Choose Your Role</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select how you'll be using KickHelper. You can change this later in your account settings.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Viewer Option */}
          <Card className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
            selectedRole === 'viewer' && isLoading ? 'border-primary' : 'border-border hover:border-primary/50'
          }`}>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">I'm a Viewer</CardTitle>
                <CardDescription>
                  Participate in giveaways and interact with streamers
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">What you can do:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Join giveaways and contests</li>
                  <li>• Get verification badges</li>
                  <li>• Track your participation</li>
                  <li>• Connect Discord for extra chances</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Verification Available
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Bonus Chances
                </Badge>
              </div>
              <Button
                onClick={() => handleRoleSelection('viewer')}
                disabled={isLoading}
                className="w-full"
                variant={selectedRole === 'viewer' && isLoading ? 'default' : 'outline'}
              >
                {selectedRole === 'viewer' && isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Setting up...
                  </>
                ) : (
                  'Choose Viewer'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Streamer Option */}
          <Card className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
            selectedRole === 'streamer' && isLoading ? 'border-primary' : 'border-border hover:border-primary/50'
          }`}>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto p-3 rounded-full bg-green-100 dark:bg-green-900/30 w-fit">
                <Radio className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl">I'm a Streamer</CardTitle>
                <CardDescription>
                  Run giveaways, manage slots, and engage your community
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">What you can do:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create and manage giveaways</li>
                  <li>• Slot machine overlays</li>
                  <li>• Chatbot management</li>
                  <li>• Viewer verification tools</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Streamer Verification
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Advanced Tools
                </Badge>
              </div>
              <Button
                onClick={() => handleRoleSelection('streamer')}
                disabled={isLoading}
                className="w-full"
                variant={selectedRole === 'streamer' && isLoading ? 'default' : 'outline'}
              >
                {selectedRole === 'streamer' && isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Setting up...
                  </>
                ) : (
                  'Choose Streamer'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can change your role anytime in account settings
          </p>
        </div>
      </div>
    </div>
  );
}