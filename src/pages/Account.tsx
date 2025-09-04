import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Mail, 
  Lock, 
  Link, 
  CheckCircle, 
  ArrowLeft,
  Settings
} from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Account() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // For Kick users adding email/password
  const [kickUserEmail, setKickUserEmail] = useState('');
  const [kickUserPassword, setKickUserPassword] = useState('');
  const [kickUserConfirmPassword, setKickUserConfirmPassword] = useState('');

  // Check authentication method
  const kickUserData = localStorage.getItem('kick_user');
  const kickUser = kickUserData ? JSON.parse(kickUserData) : null;
  const isKickAuthenticated = kickUser?.authenticated;
  const storedCreds = localStorage.getItem('kick_hybrid_credentials');
  const hasStoredCreds = storedCreds && JSON.parse(storedCreds).kick_user_id.toString() === kickUser?.id?.toString();
  
  const isEmailAuthenticated = !!user && !isKickAuthenticated;
  const isHybridAccount = !!user && isKickAuthenticated; // Kick user with Supabase account
  const isKickOnlyWithCreds = !user && isKickAuthenticated && hasStoredCreds; // Kick user with stored credentials but no session

  const getCurrentUserInfo = () => {
    if (isHybridAccount) {
      // Kick user with Supabase account
      return {
        username: kickUser.username,
        displayName: kickUser.display_name || kickUser.username,
        avatar: kickUser.avatar,
        email: user?.email || 'Auto-generated email',
        provider: 'Kick + Email (Hybrid)'
      };
    } else if (kickUser?.authenticated) {
      // Kick-only user (shouldn't happen with auto-creation)
      return {
        username: kickUser.username,
        displayName: kickUser.display_name || kickUser.username,
        avatar: kickUser.avatar,
        email: 'Not available for Kick accounts',
        provider: 'Kick'
      };
    } else if (user) {
      // Email-only user
      return {
        username: user.email?.split('@')[0] || 'User',
        displayName: user.email?.split('@')[0] || 'User',
        avatar: null,
        email: user.email,
        provider: 'Email'
      };
    }
    return null;
  };

  const userInfo = getCurrentUserInfo();

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) throw error;

      toast({
        title: "Email updated",
        description: "Please check your new email to confirm the change.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKickOAuth = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('kick-oauth', {
        body: { 
          action: 'authorize',
          origin: window.location.origin
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { authUrl, codeVerifier } = response.data;
      
      if (authUrl) {
        sessionStorage.setItem('kick_code_verifier', codeVerifier);
        sessionStorage.setItem('kick_linking_mode', 'true'); // Flag for account linking
        window.location.href = authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Kick OAuth error:', error);
      toast({
        title: "Authentication failed",
        description: "Failed to start Kick authentication. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleKickUserEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (kickUserPassword !== kickUserConfirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (kickUserPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create Supabase account for Kick user
      const { data, error } = await supabase.auth.signUp({
        email: kickUserEmail,
        password: kickUserPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            kick_username: kickUser?.username,
            kick_user_id: kickUser?.id?.toString(),
            kick_avatar: kickUser?.avatar,
            display_name: kickUser?.display_name || kickUser?.username,
            is_hybrid_account: true
          }
        }
      });
      
      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account. You can now use both Kick and email login.",
      });
      
      // Clear form
      setKickUserEmail('');
      setKickUserPassword('');
      setKickUserConfirmPassword('');
      
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithStoredCreds = async () => {
    if (!hasStoredCreds) {
      toast({
        title: "No credentials found",
        description: "Please sign in with Kick first to set up your account.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const creds = JSON.parse(storedCreds!);
      console.log('🔄 Attempting sign in with stored credentials for user:', creds.kick_user_id);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });
      
      if (error) {
        console.error('❌ Sign in failed:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('✅ Successfully signed in:', data.user.email);
        toast({
          title: "Signed in successfully!",
          description: "You can now access email and password management features.",
        });
        
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        throw new Error('No user data returned');
      }
      
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: "The stored credentials are no longer valid. Please sign in with Kick again.",
        variant: "destructive"
      });
      
      // Clear invalid credentials
      localStorage.removeItem('kick_hybrid_credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('kick_hybrid_credentials');
    toast({
      title: "Credentials cleared",
      description: "Please sign in with Kick again to generate new credentials.",
    });
    window.location.reload();
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please sign in to access your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <RouterLink to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </RouterLink>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and security</p>
          </div>
        </div>

        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {userInfo.avatar ? (
                  <AvatarImage src={userInfo.avatar} alt={userInfo.username} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-lg font-semibold">
                  {userInfo.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{userInfo.displayName}</h3>
                <p className="text-muted-foreground">@{userInfo.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={userInfo.provider === 'Kick' ? 'default' : 'secondary'}>
                    {userInfo.provider} Account
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Sign In Section - For Kick users with stored credentials but no session */}
        {isKickOnlyWithCreds && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Access
              </CardTitle>
              <CardDescription>
                Sign in to access email and password management features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Account Available:</strong> We've created a Supabase account for your Kick profile.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Sign in to manage your email and password settings.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSignInWithStoredCreds}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In to Manage Account"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleClearCredentials}
                  disabled={loading}
                >
                  Clear & Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Management - For email authenticated users AND hybrid accounts */}
        {(isEmailAuthenticated || isHybridAccount) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Address
              </CardTitle>
              <CardDescription>
                {isHybridAccount 
                  ? "Update your email address from the auto-generated one to your preferred email."
                  : "Update your email address. You'll need to verify the new email."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                {isHybridAccount && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Current email:</strong> {user?.email}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      This was auto-generated when you signed in with Kick. You can change it to your preferred email.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <Button type="submit" disabled={loading || email === user?.email}>
                  {loading ? "Updating..." : "Update Email"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Password Management - For email authenticated users AND hybrid accounts */}
        {(isEmailAuthenticated || isHybridAccount) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>
                {isHybridAccount 
                  ? "Set a password you can remember. Currently using an auto-generated secure password."
                  : "Change your account password. Make sure it's strong and unique."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {isHybridAccount && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      <strong>Auto-generated password:</strong> For security, we created a secure password when you signed in with Kick.
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Set your own password below to log in from other devices.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}


        {/* Kick Account Linking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Kick Account
            </CardTitle>
            <CardDescription>
              {isKickAuthenticated 
                ? "Your Kick account is connected and active." 
                : "Link your Kick account for enhanced features and streaming integration."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isKickAuthenticated ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Kick Account Connected
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Signed in as @{kickUser.username}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Already Linked
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    Linking your Kick account will allow you to:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Access advanced streaming features</li>
                    <li>• Manage your channel settings</li>
                    <li>• View detailed analytics</li>
                    <li>• Use chat moderation tools</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleKickOAuth}
                  disabled={loading}
                  className="gaming-button"
                >
                  <Link className="h-4 w-4 mr-2" />
                  {loading ? "Connecting..." : "Link Kick Account"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Danger Zone - Only for email authenticated users */}
        {isEmailAuthenticated && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}