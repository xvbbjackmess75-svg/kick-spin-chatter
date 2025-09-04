import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Play, Pause, RotateCcw, Target, TrendingUp, TrendingDown, Trophy, Download, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BonusHuntSession {
  id: string;
  session_name?: string;
  starting_balance: number;
  current_balance: number;
  target_bonuses: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface Slot {
  id: string;
  name: string;
  provider: string;
  rtp?: number;
  max_multiplier?: number;
  theme?: string;
  is_user_added: boolean;
}

interface BonusHuntBet {
  id: string;
  session_id: string;
  slot_id: string;
  bet_size: number;
  starting_balance: number;
  ending_balance: number;
  bonus_multiplier?: number;
  pnl: number;
  created_at: string;
  slots?: Slot;
}

export default function BonusHunt() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<BonusHuntSession | null>(null);
  const [sessions, setSessions] = useState<BonusHuntSession[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sessionBets, setSessionBets] = useState<BonusHuntBet[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [betSize, setBetSize] = useState<string>('');
  const [endingBalance, setEndingBalance] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // New session form state
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [startingBalance, setStartingBalance] = useState<string>('');

  // Add slot form state
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotProvider, setNewSlotProvider] = useState('');
  const [newSlotRtp, setNewSlotRtp] = useState<string>('');
  const [newSlotMaxMultiplier, setNewSlotMaxMultiplier] = useState<string>('');
  const [newSlotTheme, setNewSlotTheme] = useState('');
  const [importingAllSlots, setImportingAllSlots] = useState(false);

  useEffect(() => {
    if (user) {
      loadSessions();
      loadSlots();
    }
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      loadSessionBets();
    }
  }, [activeSession]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('bonus_hunt_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions((data || []) as BonusHuntSession[]);
      
      // Set active session if exists
      const active = (data || []).find(s => s.status === 'active');
      if (active) {
        setActiveSession(active as BonusHuntSession);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({ title: 'Error loading sessions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      console.log('Loading slots...');
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .order('name')
        .limit(6000); // Increase limit to get all slots

      console.log('Slots query result:', { data, error });
      if (error) {
        console.error('Error loading slots:', error);
        throw error;
      }
      console.log('Setting slots data:', data?.length || 0, 'slots');
      setSlots(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const loadSessionBets = async () => {
    if (!activeSession) return;

    try {
      const { data, error } = await supabase
        .from('bonus_hunt_bets')
        .select(`
          id,
          session_id,
          slot_id,
          bet_size,
          starting_balance,
          ending_balance,
          bonus_multiplier,
          pnl,
          created_at,
          slots!slot_id (
            id,
            name,
            provider,
            rtp,
            max_multiplier,
            theme,
            is_user_added
          )
        `)
        .eq('session_id', activeSession.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessionBets((data || []) as BonusHuntBet[]);
    } catch (error) {
      console.error('Error loading session bets:', error);
    }
  };

  const createSession = async () => {
    if (!user || !startingBalance) return;

    try {
      const { data, error } = await supabase
        .from('bonus_hunt_sessions')
        .insert({
          user_id: user.id,
          session_name: newSessionName || undefined,
          starting_balance: parseFloat(startingBalance),
          current_balance: parseFloat(startingBalance),
          target_bonuses: 0,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession(data as BonusHuntSession);
      setSessions(prev => [data as BonusHuntSession, ...prev]);
      setShowNewSessionDialog(false);
      setNewSessionName('');
      setStartingBalance('');
      toast({ title: 'Session created successfully!' });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({ title: 'Error creating session', variant: 'destructive' });
    }
  };

  const addSlot = async () => {
    if (!user || !newSlotName || !newSlotProvider) return;

    try {
      const { data, error } = await supabase
        .from('slots')
        .insert({
          name: newSlotName,
          provider: newSlotProvider,
          rtp: newSlotRtp ? parseFloat(newSlotRtp) : undefined,
          max_multiplier: newSlotMaxMultiplier ? parseInt(newSlotMaxMultiplier) : undefined,
          theme: newSlotTheme || undefined,
          is_user_added: true,
          added_by_user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setSlots(prev => [...prev, data]);
      setShowAddSlotDialog(false);
      setNewSlotName('');
      setNewSlotProvider('');
      setNewSlotRtp('');
      setNewSlotMaxMultiplier('');
      setNewSlotTheme('');
      toast({ title: 'Slot added successfully!' });
    } catch (error) {
      console.error('Error adding slot:', error);
      toast({ title: 'Error adding slot', variant: 'destructive' });
    }
  };

  const importAllSlotsFromAboutSlots = async () => {
    setImportingAllSlots(true);
    
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
          
          // Small delay between runs to avoid overwhelming the system
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
      
      loadSlots(); // Refresh the slots list
    } catch (error) {
      console.error('Error importing all slots:', error);
      toast({ 
        title: 'Error importing slots', 
        description: 'Failed to import slots from aboutslots.com',
        variant: 'destructive' 
      });
    } finally {
      setImportingAllSlots(false);
    }
  };

  const recordBet = async () => {
    if (!activeSession || !selectedSlot || !betSize || !endingBalance) return;

    const betAmount = parseFloat(betSize);
    const newBalance = parseFloat(endingBalance);
    const pnl = newBalance - activeSession.current_balance;
    const bonusMultiplier = pnl > 0 ? (pnl + betAmount) / betAmount : 0;

    try {
      const { error: betError } = await supabase
        .from('bonus_hunt_bets')
        .insert({
          session_id: activeSession.id,
          slot_id: selectedSlot.id,
          bet_size: betAmount,
          starting_balance: activeSession.current_balance,
          ending_balance: newBalance,
          bonus_multiplier: bonusMultiplier,
          pnl: pnl
        });

      if (betError) throw betError;

      // Update session balance
      const { error: sessionError } = await supabase
        .from('bonus_hunt_sessions')
        .update({ current_balance: newBalance })
        .eq('id', activeSession.id);

      if (sessionError) throw sessionError;

      setActiveSession(prev => prev ? { ...prev, current_balance: newBalance } : null);
      setBetSize('');
      setEndingBalance('');
      setSelectedSlot(null);
      loadSessionBets();
      toast({ title: 'Bet recorded successfully!' });
    } catch (error) {
      console.error('Error recording bet:', error);
      toast({ title: 'Error recording bet', variant: 'destructive' });
    }
  };

  const toggleSessionStatus = async (status: 'active' | 'paused' | 'completed') => {
    if (!activeSession) return;

    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bonus_hunt_sessions')
        .update(updateData)
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(prev => prev ? { ...prev, status, ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}) } : null);
      if (status === 'completed') {
        setActiveSession(null);
      }
      loadSessions();
      toast({ title: `Session ${status}!` });
    } catch (error) {
      console.error('Error updating session:', error);
      toast({ title: 'Error updating session', variant: 'destructive' });
    }
  };

  const filteredSlots = slots.filter(slot =>
    slot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slot.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slot.theme?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug logging
  console.log('Total slots loaded:', slots.length);
  console.log('Search term:', searchTerm);
  console.log('Filtered slots:', filteredSlots.length);
  if (searchTerm.toLowerCase().includes('wanted')) {
    console.log('Slots containing "wanted":', slots.filter(s => s.name.toLowerCase().includes('wanted')));
  }

  const totalPnL = sessionBets.reduce((sum, bet) => sum + bet.pnl, 0);
  const totalBets = sessionBets.length;
  const averageMultiplier = sessionBets.length > 0 
    ? sessionBets.reduce((sum, bet) => sum + (bet.bonus_multiplier || 0), 0) / sessionBets.length 
    : 0;
  const bonusesLeft = activeSession ? Math.max(0, activeSession.target_bonuses - sessionBets.length) : 0;
  const requiredMultiplier = activeSession && bonusesLeft > 0 
    ? Math.abs(totalPnL) / bonusesLeft 
    : 0;

  const sessionStats = {
    totalPnL,
    totalBets,
    averageMultiplier,
    bonusesLeft,
    requiredMultiplier
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bonus Hunt</h1>
        <div className="flex gap-2">
          {!activeSession && (
            <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Start Hunt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Bonus Hunt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sessionName">Session Name (Optional)</Label>
                    <Input
                      id="sessionName"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="e.g., Morning Hunt"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startingBalance">Starting Balance</Label>
                    <Input
                      id="startingBalance"
                      type="number"
                      step="0.01"
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(e.target.value)}
                      placeholder="100.00"
                    />
                  </div>
                  <Button onClick={createSession} className="w-full">
                    Start Hunt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {activeSession && (
        <>
          {/* Session Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {activeSession.session_name || 'Bonus Hunt Session'}
                  <Badge variant={activeSession.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {activeSession.status}
                  </Badge>
                </CardTitle>
                <div className="flex gap-2">
                  {activeSession.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSessionStatus('paused')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => toggleSessionStatus('completed')}
                      >
                        Complete
                      </Button>
                    </>
                  )}
                  {activeSession.status === 'paused' && (
                    <Button
                      size="sm"
                      onClick={() => toggleSessionStatus('active')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${activeSession.current_balance.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${sessionStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sessionStats.totalPnL >= 0 ? '+' : ''}${sessionStats.totalPnL.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total P&L</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{sessionStats.totalBets}</div>
                  <div className="text-sm text-muted-foreground">Bonuses Hunted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{sessionStats.bonusesLeft}</div>
                  <div className="text-sm text-muted-foreground">Bonuses Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{sessionStats.averageMultiplier.toFixed(1)}x</div>
                  <div className="text-sm text-muted-foreground">Avg Multiplier</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{sessionStats.requiredMultiplier.toFixed(1)}x</div>
                  <div className="text-sm text-muted-foreground">Required Avg</div>
                </div>
              </div>
              
              {activeSession.target_bonuses > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{sessionStats.totalBets} / {activeSession.target_bonuses}</span>
                  </div>
                  <Progress 
                    value={(sessionStats.totalBets / activeSession.target_bonuses) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hunt Interface */}
          {activeSession.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Hunt Bonus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Slot Selection */}
                <div>
                  <Label>Select Slot</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search slots..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Slot</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="slotName">Slot Name</Label>
                            <Input
                              id="slotName"
                              value={newSlotName}
                              onChange={(e) => setNewSlotName(e.target.value)}
                              placeholder="e.g., Book of Dead"
                            />
                          </div>
                          <div>
                            <Label htmlFor="slotProvider">Provider</Label>
                            <Input
                              id="slotProvider"
                              value={newSlotProvider}
                              onChange={(e) => setNewSlotProvider(e.target.value)}
                              placeholder="e.g., Play'n GO"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="slotRtp">RTP (%)</Label>
                              <Input
                                id="slotRtp"
                                type="number"
                                step="0.01"
                                value={newSlotRtp}
                                onChange={(e) => setNewSlotRtp(e.target.value)}
                                placeholder="96.21"
                              />
                            </div>
                            <div>
                              <Label htmlFor="slotMaxMultiplier">Max Multiplier</Label>
                              <Input
                                id="slotMaxMultiplier"
                                type="number"
                                value={newSlotMaxMultiplier}
                                onChange={(e) => setNewSlotMaxMultiplier(e.target.value)}
                                placeholder="5000"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="slotTheme">Theme</Label>
                            <Input
                              id="slotTheme"
                              value={newSlotTheme}
                              onChange={(e) => setNewSlotTheme(e.target.value)}
                              placeholder="e.g., Egyptian"
                            />
                          </div>
                          <Button onClick={addSlot} className="w-full">
                            Add Slot
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      onClick={importAllSlotsFromAboutSlots}
                      disabled={importingAllSlots}
                      size="sm"
                      className="min-w-32"
                    >
                      <Database className="h-4 w-4 mr-1" />
                      {importingAllSlots ? 'Importing...' : 'Import All 200 Pages'}
                    </Button>
                  </div>
                </div>

                {/* Slot Grid */}
                {(searchTerm || slots.length > 0) && (
                  <div className="space-y-2">
                    {searchTerm && (
                      <div className="text-sm text-muted-foreground">
                        {filteredSlots.length} slot(s) found
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                      {(searchTerm ? filteredSlots : slots.slice(0, 20)).map((slot) => (
                        <Card
                          key={slot.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedSlot?.id === slot.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <CardContent className="p-3">
                            <div className="font-medium">{slot.name}</div>
                            <div className="text-sm text-muted-foreground">{slot.provider}</div>
                            {slot.theme && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {slot.theme}
                              </Badge>
                            )}
                            {slot.rtp && (
                              <div className="text-xs text-muted-foreground mt-1">
                                RTP: {slot.rtp}%
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {!searchTerm && slots.length > 20 && (
                      <div className="text-sm text-muted-foreground text-center">
                        Showing first 20 slots. Use search to find specific slots.
                      </div>
                    )}
                  </div>
                )}

                {selectedSlot && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="font-medium">Selected: {selectedSlot.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedSlot.provider}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Bet Input */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="betSize">Bet Size</Label>
                    <Input
                      id="betSize"
                      type="number"
                      step="0.01"
                      value={betSize}
                      onChange={(e) => setBetSize(e.target.value)}
                      placeholder="1.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endingBalance">Ending Balance</Label>
                    <Input
                      id="endingBalance"
                      type="number"
                      step="0.01"
                      value={endingBalance}
                      onChange={(e) => setEndingBalance(e.target.value)}
                      placeholder={activeSession.current_balance.toFixed(2)}
                    />
                  </div>
                </div>

                <Button
                  onClick={recordBet}
                  disabled={!selectedSlot || !betSize || !endingBalance}
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Record Bonus
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Sessions & History */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Current Session</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4">
          {activeSession && sessionBets.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Session Bets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionBets.map((bet) => (
                    <div key={bet.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{bet.slots?.name}</div>
                        <div className="text-sm text-muted-foreground">{bet.slots?.provider}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${bet.bet_size.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {bet.bonus_multiplier ? `${bet.bonus_multiplier.toFixed(1)}x` : '0x'}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`font-medium ${bet.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {bet.pnl >= 0 ? '+' : ''}${bet.pnl.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(bet.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : activeSession ? (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bonuses recorded yet. Start hunting!</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active session. Start a new bonus hunt!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Previous Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.filter(s => s.status !== 'active').map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {session.session_name || 'Bonus Hunt Session'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${session.starting_balance.toFixed(2)} → ${session.current_balance.toFixed(2)}</div>
                        <div className={`text-sm ${(session.current_balance - session.starting_balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(session.current_balance - session.starting_balance) >= 0 ? '+' : ''}${(session.current_balance - session.starting_balance).toFixed(2)}
                        </div>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No previous sessions found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}