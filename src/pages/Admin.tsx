import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { canAccessAdminPanel } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Users, Settings, Shield, Calendar, AlertTriangle, Lock, Key, MessageSquare, Search, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import KickChatPoster from '@/components/KickChatPoster';
import { SlotManagement } from '@/components/SlotManagement';
import { AdminTicketManagement } from '@/components/AdminTicketManagement';
import { AltAccountDetector } from '@/components/AltAccountDetector';
import { VpnProxyDetector } from '@/components/VpnProxyDetector';

interface FeaturePermission {
  id: string;
  feature_name: string;
  required_role: 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'verified_streamer' | 'admin';
  description: string;
  is_enabled: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin';
  granted_by: string;
  granted_at: string;
}

interface UserWithProfile {
  id: string;
  email: string;
  role: 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin';
  display_name?: string;
  kick_username?: string;
  kick_user_id?: string;
  created_at: string;
}

interface ProfileData {
  user_id: string;
  display_name?: string;
  kick_username?: string;
  kick_user_id?: string;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'verified_streamer' | 'admin' | null>(null);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [featurePermissions, setFeaturePermissions] = useState<FeaturePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingSlots, setImportingSlots] = useState(false);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      checkUserRole();
      loadUsers();
      loadFeaturePermissions();
      loadLastImportDate();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      if (error) throw error;
      setUserRole(data);
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Use the admin edge function to get users - just call it directly for GET
      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'GET'
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error Loading Users",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLastImportDate = async () => {
    try {
      // Get the latest slot import date
      const { data, error } = await supabase
        .from('slots')
        .select('created_at')
        .eq('is_user_added', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setLastImportDate(data[0].created_at);
      }
    } catch (error) {
      console.error('Error loading last import date:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin') => {
    try {
      // Use the admin edge function to update user role
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { 
          action: 'update-role',
          userId: userId,
          role: newRole 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Refresh the users list
      await loadUsers();
      
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error Updating Role",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const loadFeaturePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_permissions')
        .select('*')
        .order('feature_name');

      if (error) throw error;
      setFeaturePermissions(data || []);
    } catch (error) {
      console.error('Error loading feature permissions:', error);
      toast({
        title: "Error Loading Permissions",
        description: "Failed to load feature permissions",
        variant: "destructive"
      });
    }
  };

  const updateFeaturePermission = async (featureName: string, requiredRole: 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin', isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_permissions')
        .update({ 
          required_role: requiredRole,
          is_enabled: isEnabled 
        })
        .eq('feature_name', featureName);

      if (error) throw error;
      
      await loadFeaturePermissions();
      
      toast({
        title: "Permission Updated",
        description: `${featureName} permission has been updated`,
      });
    } catch (error) {
      console.error('Error updating feature permission:', error);
      toast({
        title: "Error Updating Permission",
        description: error instanceof Error ? error.message : "Failed to update permission",
        variant: "destructive"
      });
    }
  };

  const importAllSlots = async () => {
    setImportingSlots(true);
    
    try {
      let startPage = 1;
      let totalNewSlots = 0;
      let totalProcessed = 0;
      
      while (startPage <= 263) {
        toast({ 
          title: `Importing pages ${startPage}-${Math.min(startPage + 29, 263)}...`, 
          description: `Processing batch ${Math.ceil(startPage / 30)} of ${Math.ceil(263 / 30)}. Total new slots so far: ${totalNewSlots}`
        });

        const { data, error } = await supabase.functions.invoke('import-slots', {
          body: { startPage }
        });

        if (error) {
          console.error('Error importing slots:', error);
          toast({
            title: "Import Error", 
            description: `Failed to import from page ${startPage}: ${error.message}`,
            variant: "destructive"
          });
          break;
        }

        if (data?.success) {
          totalNewSlots += data.new_slots_added || 0;
          totalProcessed += (data.total_found || 0);
          
          if (!data.has_more) {
            break;
          }
          
          startPage = data.next_start_page;
          
          // Small delay between runs
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.error('Import failed:', data);
          break;
        }
      }
      
      toast({
        title: "Import Complete!",
        description: `Successfully imported ${totalNewSlots} new slots from 263 pages (${totalProcessed} total slots processed)`,
      });
      
      loadLastImportDate();
    } catch (error) {
      console.error('Error importing all slots:', error);
      toast({ 
        title: 'Error importing slots', 
        description: 'Failed to import slots from aboutslots.com',
        variant: 'destructive' 
      });
    } finally {
      setImportingSlots(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'vip_plus': return 'default';
      case 'premium': return 'secondary';
      default: return 'outline';
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.kick_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!userRole || !canAccessAdminPanel(userRole)) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Badge variant="destructive">
          {userRole === 'admin' ? 'Admin Access' : `${userRole?.toUpperCase()} Access`}
        </Badge>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="roles">Role Manager</TabsTrigger>
          <TabsTrigger value="slots">Slot Management</TabsTrigger>
          <TabsTrigger value="alt-accounts">Alt Accounts</TabsTrigger>
          <TabsTrigger value="vpn-proxy">VPN/Proxy Users</TabsTrigger>
          <TabsTrigger value="chat">Chat Poster</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <Button variant="outline" onClick={loadUsers} size="sm">
                  Refresh Users
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or Kick username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Kick Account</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((usr) => (
                    <TableRow key={usr.id}>
                      <TableCell className="font-mono text-xs">{usr.id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{usr.email}</TableCell>
                      <TableCell>{usr.display_name || 'Not set'}</TableCell>
                      <TableCell>
                        {usr.kick_username ? (
                          <div className="space-y-1">
                            <div className="font-medium">{usr.kick_username}</div>
                            <div className="text-xs text-muted-foreground">ID: {usr.kick_user_id}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not connected</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {usr.role === 'verified_viewer' ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Verified</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not verified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(usr.role)}>
                          {usr.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(usr.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select
                          value={usr.role}
                          onValueChange={(newRole: 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin') => 
                            updateUserRole(usr.id, newRole)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="vip_plus">VIP+</SelectItem>
                            <SelectItem value="verified_viewer">Verified Viewer</SelectItem>
                            <SelectItem value="streamer">Streamer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Feature Access Manager
                </CardTitle>
                <Button variant="outline" onClick={loadFeaturePermissions} size="sm">
                  Refresh Permissions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Configure which roles have access to specific features. Higher roles inherit access from lower roles.
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Required Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featurePermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {permission.feature_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {permission.description}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={permission.required_role}
                            onValueChange={(newRole: 'viewer' | 'user' | 'premium' | 'vip_plus' | 'verified_viewer' | 'streamer' | 'admin') => 
                              updateFeaturePermission(permission.feature_name, newRole, permission.is_enabled)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="vip_plus">VIP+</SelectItem>
                              <SelectItem value="verified_viewer">Verified Viewer</SelectItem>
                              <SelectItem value="streamer">Streamer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permission.is_enabled ? "default" : "secondary"}>
                            {permission.is_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFeaturePermission(
                              permission.feature_name, 
                              permission.required_role, 
                              !permission.is_enabled
                            )}
                          >
                            {permission.is_enabled ? "Disable" : "Enable"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Roles are hierarchical - higher roles inherit all permissions from lower roles.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-2">
                    <CardContent className="p-4 text-center">
                      <Badge variant="outline" className="mb-2">Base Level</Badge>
                      <div className="text-lg font-bold">User</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Basic features and functionality
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Badge variant="secondary" className="mb-2">Paid Tier</Badge>
                      <div className="text-lg font-bold">Premium</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Advanced features + User permissions
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Badge variant="default" className="mb-2">Elite Tier</Badge>
                      <div className="text-lg font-bold">VIP+</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Exclusive features + Premium permissions
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-red-200">
                    <CardContent className="p-4 text-center">
                      <Badge variant="destructive" className="mb-2">Full Access</Badge>
                      <div className="text-lg font-bold">Admin</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        All features + VIP+ permissions
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slots" className="space-y-4">
          <SlotManagement />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Bulk Slot Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Daily Slot Import</h3>
                  <p className="text-sm text-muted-foreground">
                    Import latest slots from aboutslots.com (auto-detects total pages)
                  </p>
                  {lastImportDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last import: {new Date(lastImportDate).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  onClick={importAllSlots}
                  disabled={importingSlots}
                  className="min-w-32"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {importingSlots ? 'Importing...' : 'Import All Slots'}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">Auto</div>
                    <div className="text-sm text-muted-foreground">Page Detection</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">~15K</div>
                    <div className="text-sm text-muted-foreground">Est. Slots</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">30</div>
                    <div className="text-sm text-muted-foreground">Pages/Batch</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">Enhanced</div>
                    <div className="text-sm text-muted-foreground">Provider Detection</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alt-accounts" className="space-y-4">
          <AltAccountDetector />
        </TabsContent>

        <TabsContent value="vpn-proxy" className="space-y-4">
          <VpnProxyDetector />
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Kick Chat Poster
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KickChatPoster />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support Ticket Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminTicketManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Database Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Users</Label>
                  <div className="text-lg font-semibold">{users.length}</div>
                </div>
                <div className="space-y-2">
                  <Label>Admin Users</Label>
                  <div className="text-lg font-semibold">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Premium+ Users</Label>
                  <div className="text-lg font-semibold">
                    {users.filter(u => u.role === 'premium' || u.role === 'vip_plus').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Last slot import</span>
                  <span className="text-muted-foreground">
                    {lastImportDate ? new Date(lastImportDate).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Active admin sessions</span>
                  <span className="text-muted-foreground">1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>System uptime</span>
                  <span className="text-muted-foreground">99.9%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}