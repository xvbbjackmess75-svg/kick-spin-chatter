import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Users, Clock, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface PotentialAltAccount {
  ip_address: string;
  user_count: number;
  users: Array<{
    user_id: string;
    display_name: string;
    kick_username: string;
    is_streamer: boolean;
    first_seen_at: string;
    last_seen_at: string;
    occurrence_count: number;
  }>;
}

function AltAccountDetector() {
  const [altAccounts, setAltAccounts] = useState<PotentialAltAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPotentialAltAccounts();
  }, []);

  const fetchPotentialAltAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_potential_alt_accounts');

      if (error) {
        throw error;
      }

      // Type cast the data properly
      const typedData = (data || []).map((item: any) => ({
        ip_address: String(item.ip_address),
        user_count: Number(item.user_count),
        users: Array.isArray(item.users) ? item.users : []
      }));

      setAltAccounts(typedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch potential alt accounts');
      console.error('Error fetching alt accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getRiskLevel = (userCount: number) => {
    if (userCount >= 5) return { level: 'High', color: 'destructive' };
    if (userCount >= 3) return { level: 'Medium', color: 'default' };
    return { level: 'Low', color: 'secondary' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading potential alt accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alt Account Detection</h2>
          <p className="text-muted-foreground">
            Monitor accounts sharing the same IP address for potential multi-account usage
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{altAccounts.length} suspicious IP addresses detected</span>
        </div>
      </div>

      {altAccounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Alt Accounts Detected</p>
              <p className="text-sm">All users appear to be using unique IP addresses.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {altAccounts.map((altAccount, index) => {
            const risk = getRiskLevel(altAccount.user_count);
            
            return (
              <Card key={index} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg">
                          IP: {altAccount.ip_address}
                        </CardTitle>
                      </div>
                      <Badge variant={risk.color as any}>
                        {risk.level} Risk
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{altAccount.user_count} accounts</span>
                    </div>
                  </div>
                  <CardDescription>
                    Multiple accounts detected from the same IP address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {altAccount.users.map((user, userIndex) => (
                      <div key={userIndex} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">
                                {user.display_name || user.kick_username || 'Unknown User'}
                              </p>
                              {user.kick_username && (
                                <p className="text-sm text-muted-foreground">
                                  @{user.kick_username}
                                </p>
                              )}
                            </div>
                            {user.is_streamer && (
                              <Badge variant="secondary">Streamer</Badge>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{user.occurrence_count} sessions</span>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>First seen: {formatDate(user.first_seen_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Last seen: {formatDate(user.last_seen_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Action Required:</strong> Review these accounts for potential violations. 
                      Consider investigating if users are circumventing restrictions or creating multiple accounts.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { AltAccountDetector };
export default AltAccountDetector;