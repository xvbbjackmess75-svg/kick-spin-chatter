import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, RefreshCw, Globe, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VpnProxyUser {
  user_id: string;
  display_name: string;
  kick_username: string;
  ip_address: string;
  proxy_type: string;
  risk_score: number;
  country: string;
  provider: string;
  first_detected: string;
  last_detected: string;
  detection_count: number;
}

export function VpnProxyDetector() {
  const [vpnUsers, setVpnUsers] = useState<VpnProxyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVpnProxyUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_vpn_proxy_users');
      
      if (error) {
        console.error('Error fetching VPN/Proxy users:', error);
        toast({
          title: "Error",
          description: "Failed to load VPN/Proxy users",
          variant: "destructive"
        });
        return;
      }

      setVpnUsers((data as VpnProxyUser[]) || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error", 
        description: "Failed to load VPN/Proxy users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVpnProxyUsers();
  }, []);

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 75) return 'destructive';
    if (riskScore >= 50) return 'secondary';
    return 'default';
  };

  const getProxyTypeBadgeColor = (proxyType: string) => {
    switch (proxyType.toLowerCase()) {
      case 'vpn': return 'outline';
      case 'proxy': return 'secondary';
      case 'tor': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">VPN/Proxy Detection</h2>
          <p className="text-muted-foreground">
            Monitor users accessing your platform through VPNs, proxies, or Tor networks
          </p>
        </div>
        <Button onClick={fetchVpnProxyUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Detections</TabsTrigger>
          <TabsTrigger value="vpn">VPN Users</TabsTrigger>
          <TabsTrigger value="proxy">Proxy Users</TabsTrigger>
          <TabsTrigger value="tor">Tor Users</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading VPN/Proxy data...
                  </div>
                </CardContent>
              </Card>
            ) : vpnUsers.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Shield className="h-6 w-6 mr-2" />
                    No VPN/Proxy users detected
                  </div>
                </CardContent>
              </Card>
            ) : (
              vpnUsers.map((user) => (
                <Card key={`${user.user_id}-${user.ip_address}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {user.display_name || user.kick_username || 'Unknown User'}
                        </CardTitle>
                        <CardDescription>
                          IP: {user.ip_address} • {user.country}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getProxyTypeBadgeColor(user.proxy_type)}>
                          {user.proxy_type.toUpperCase()}
                        </Badge>
                        <Badge variant={getRiskBadgeColor(user.risk_score)}>
                          Risk: {user.risk_score}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Provider</div>
                        <div className="text-muted-foreground">{user.provider || 'Unknown'}</div>
                      </div>
                      <div>
                        <div className="font-medium">First Detected</div>
                        <div className="text-muted-foreground">
                          {new Date(user.first_detected).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Last Detected</div>
                        <div className="text-muted-foreground">
                          {new Date(user.last_detected).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Detections</div>
                        <div className="text-muted-foreground">{user.detection_count}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {['vpn', 'proxy', 'tor'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid gap-4">
              {vpnUsers
                .filter((user) => user.proxy_type.toLowerCase() === type)
                .map((user) => (
                  <Card key={`${user.user_id}-${user.ip_address}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {user.display_name || user.kick_username || 'Unknown User'}
                          </CardTitle>
                          <CardDescription>
                            IP: {user.ip_address} • {user.country}
                          </CardDescription>
                        </div>
                        <Badge variant={getRiskBadgeColor(user.risk_score)}>
                          Risk: {user.risk_score}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Provider</div>
                          <div className="text-muted-foreground">{user.provider || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="font-medium">First Detected</div>
                          <div className="text-muted-foreground">
                            {new Date(user.first_detected).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Last Detected</div>
                          <div className="text-muted-foreground">
                            {new Date(user.last_detected).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Detections</div>
                          <div className="text-muted-foreground">{user.detection_count}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {vpnUsers.filter((user) => user.proxy_type.toLowerCase() === type).length === 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Globe className="h-6 w-6 mr-2" />
                      No {type.toUpperCase()} users detected
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}