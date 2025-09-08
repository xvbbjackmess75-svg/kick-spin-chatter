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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Play, Pause, RotateCcw, Target, TrendingUp, TrendingDown, Trophy, Download, Database, Gift, ExternalLink, Settings, Palette } from 'lucide-react';
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
  bonus_opening_phase?: boolean;
  bonus_opening_started_at?: string;
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
  payout_amount?: number;
  payout_recorded_at?: string;
}

export default function BonusHunt() {
  console.log('🔧 BonusHunt component rendering...');
  const { user, loading: authLoading } = useAuth();
  const [activeSession, setActiveSession] = useState<BonusHuntSession | null>(null);
  const [sessions, setSessions] = useState<BonusHuntSession[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sessionBets, setSessionBets] = useState<BonusHuntBet[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [betSize, setBetSize] = useState<string>('');
  const [endingBalance, setEndingBalance] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  console.log('🔧 BonusHunt user state:', { user: user?.email, authLoading, loading });

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

  // Bonus opening form state
  const [selectedBetForPayout, setSelectedBetForPayout] = useState<BonusHuntBet | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [editingPayout, setEditingPayout] = useState<BonusHuntBet | null>(null);
  const [newPayoutAmount, setNewPayoutAmount] = useState('');

  // Overlay customization states
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [overlaySettings, setOverlaySettings] = useState({
    background_color: 'rgba(0, 0, 0, 0.95)',
    border_color: 'hsl(var(--primary))',
    text_color: 'hsl(var(--foreground))',
    accent_color: 'hsl(var(--primary))',
    font_size: 'medium',
    max_visible_bonuses: 5,
    scrolling_speed: 50,
    show_expected_payouts: true,
    show_upcoming_bonuses: true,
    show_top_multipliers: true,
    show_background: true,
    show_borders: true,
    animation_enabled: true
  });

  // Color presets for overlay themes
  const colorPresets = [
    {
      name: "Gaming Blue",
      background: "rgba(15, 23, 42, 0.95)",
      border: "#3b82f6",
      text: "#ffffff",
      accent: "#60a5fa"
    },
    {
      name: "Neon Purple", 
      background: "rgba(30, 9, 51, 0.95)",
      border: "#a855f7",
      text: "#ffffff",
      accent: "#c084fc"
    },
    {
      name: "Fire Red",
      background: "rgba(51, 12, 12, 0.95)", 
      border: "#ef4444",
      text: "#ffffff",
      accent: "#f87171"
    },
    {
      name: "Matrix Green",
      background: "rgba(5, 20, 5, 0.95)",
      border: "#22c55e", 
      text: "#ffffff",
      accent: "#4ade80"
    },
    {
      name: "Gold Luxury",
      background: "rgba(20, 16, 8, 0.95)",
      border: "#facc15",
      text: "#ffffff", 
      accent: "#fde047"
    },
    {
      name: "Clean White",
      background: "rgba(248, 250, 252, 0.95)",
      border: "#64748b",
      text: "#1e293b",
      accent: "#3b82f6"
    }
  ];

  useEffect(() => {
    if (user) {
      loadSessions();
      loadSlots();
      fetchOverlaySettings();
      
      // Load persisted form data
      const savedData = localStorage.getItem(`bonusHunt_${user.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.newSessionName) setNewSessionName(parsed.newSessionName);
        if (parsed.startingBalance) setStartingBalance(parsed.startingBalance);
        if (parsed.betSize) setBetSize(parsed.betSize);
        if (parsed.endingBalance) setEndingBalance(parsed.endingBalance);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      loadSessionBets();
    }
  }, [activeSession]);

  // Persist form data
  useEffect(() => {
    if (user) {
      const dataToSave = {
        newSessionName,
        startingBalance,
        betSize,
        endingBalance
      };
      localStorage.setItem(`bonusHunt_${user.id}`, JSON.stringify(dataToSave));
    }
  }, [user, newSessionName, startingBalance, betSize, endingBalance]);

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
      console.log('Loading all slots...');
      let allSlots: Slot[] = [];
      let start = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('slots')
          .select('*')
          .order('name')
          .range(start, start + batchSize - 1);

        if (error) {
          console.error('Error loading slots batch:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allSlots = [...allSlots, ...data];
          start += batchSize;
          hasMore = data.length === batchSize; // Continue if we got a full batch
          console.log(`Loaded batch: ${data.length} slots, total so far: ${allSlots.length}`);
        } else {
          hasMore = false;
        }
      }

      console.log('Final slots loaded:', allSlots.length);
      setSlots(allSlots);
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

  const startBonusOpening = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from('bonus_hunt_sessions')
        .update({
          bonus_opening_phase: true
        } as any)
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(prev => prev ? { 
        ...prev, 
        bonus_opening_phase: true
      } : null);
      toast({ title: 'Bonus opening phase started!' });
    } catch (error) {
      console.error('Error starting bonus opening:', error);
      toast({ title: 'Error starting bonus opening', variant: 'destructive' });
    }
  };

  const recordPayout = async () => {
    if (!selectedBetForPayout || !payoutAmount) return;

    try {
      const payout = parseFloat(payoutAmount);
      
      const { error } = await supabase
        .from('bonus_hunt_bets')
        .update({
          payout_amount: payout,
          payout_recorded_at: new Date().toISOString()
        })
        .eq('id', selectedBetForPayout.id);

      if (error) throw error;

      // Update the local state immediately to reflect changes
      setSessionBets(prev => prev.map(bet => 
        bet.id === selectedBetForPayout.id 
          ? { ...bet, payout_amount: payout, payout_recorded_at: new Date().toISOString() }
          : bet
      ));

      setSelectedBetForPayout(null);
      setPayoutAmount('');
      toast({ title: 'Payout recorded successfully!' });
    } catch (error) {
      console.error('Error recording payout:', error);
      toast({ title: 'Error recording payout', variant: 'destructive' });
    }
  };

  const editPayout = async () => {
    if (!editingPayout || !newPayoutAmount) return;

    try {
      const payout = parseFloat(newPayoutAmount);
      
      const { error } = await supabase
        .from('bonus_hunt_bets')
        .update({
          payout_amount: payout,
          payout_recorded_at: new Date().toISOString()
        })
        .eq('id', editingPayout.id);

      if (error) throw error;

      // Update the local state immediately
      setSessionBets(prev => prev.map(bet => 
        bet.id === editingPayout.id 
          ? { ...bet, payout_amount: payout, payout_recorded_at: new Date().toISOString() }
          : bet
      ));

      setEditingPayout(null);
      setNewPayoutAmount('');
      toast({ title: 'Payout updated successfully!' });
    } catch (error) {
      console.error('Error editing payout:', error);
      toast({ title: 'Error editing payout', variant: 'destructive' });
    }
  };

  const fetchOverlaySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bonus_hunt_overlay_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching overlay settings:", error);
        return;
      }

      if (data) {
        setOverlaySettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error("Error fetching overlay settings:", error);
    }
  };

  const saveOverlaySettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bonus_hunt_overlay_settings')
        .upsert({
          user_id: user.id,
          ...overlaySettings
        });

      if (error) throw error;

      toast({
        title: "Settings saved!",
        description: "Overlay settings saved successfully!",
      });
      setIsOverlayDialogOpen(false);
    } catch (error) {
      console.error("Error saving overlay settings:", error);
      toast({
        title: "Error",
        description: "Failed to save overlay settings",
        variant: "destructive",
      });
    }
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setOverlaySettings(prev => ({
      ...prev,
      background_color: preset.background,
      border_color: preset.border,
      text_color: preset.text,
      accent_color: preset.accent
    }));
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

  // Calculate stats based on payouts vs bets
  const totalBetAmount = sessionBets.reduce((sum, bet) => sum + bet.bet_size, 0);
  const totalPayouts = sessionBets.reduce((sum, bet) => sum + (bet.payout_amount || 0), 0);
  const totalPnL = totalPayouts - totalBetAmount;
  const totalBets = sessionBets.length;
  
  // Calculate current avg multiplier - only from opened bonuses
  const openedBets = sessionBets.filter(bet => bet.payout_amount !== null && bet.payout_amount !== undefined);
  const openedBetAmount = openedBets.reduce((sum, bet) => sum + bet.bet_size, 0);
  const openedPayouts = openedBets.reduce((sum, bet) => sum + (bet.payout_amount || 0), 0);
  const currentAvgMulti = openedBetAmount > 0 ? openedPayouts / openedBetAmount : 0;
  
  // Calculate required average multiplier to break even - FIXED calculation
  const requiredAvgMulti = totalBetAmount > 0 && activeSession ? activeSession.starting_balance / totalBetAmount : 0;
  const isProfit = totalBets > 0 ? totalPayouts >= totalBetAmount : false;
  
  const bonusesLeft = activeSession ? Math.max(0, activeSession.target_bonuses - sessionBets.length) : 0;

  const sessionStats = {
    totalPnL,
    totalBets,
    currentAvgMulti,
    requiredAvgMulti,
    bonusesLeft,
    isProfit
  };

  const bonusesWithPayouts = sessionBets.filter(bet => bet.payout_amount).length;

  console.log('🔧 BonusHunt render states:', { loading, authLoading, user: !!user, activeSession: !!activeSession, sessionsLength: sessions.length, slotsLength: slots.length });
  
  if (authLoading || loading) {
    console.log('🔧 BonusHunt showing loading state');
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!user) {
    console.log('🔧 BonusHunt no user, showing auth message');
    return <div className="flex items-center justify-center h-64">Please log in to access Bonus Hunt</div>;
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
                  {activeSession.status === 'active' && !activeSession.bonus_opening_phase && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSessionStatus('paused')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      {sessionBets.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={startBonusOpening}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Start Opening
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => toggleSessionStatus('completed')}
                      >
                        Complete
                      </Button>
                    </>
                  )}
                  {activeSession.status === 'active' && activeSession.bonus_opening_phase && (
                    <Badge variant="outline" className="text-kick-purple border-kick-purple/50 bg-kick-purple/10">
                      <Gift className="h-4 w-4 mr-1" />
                      Opening Bonuses
                    </Badge>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/bonus-hunt-overlay?userId=${user?.id}&maxBonuses=${overlaySettings.max_visible_bonuses}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Overlay
                  </Button>
                  <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Customize Overlay
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    ${activeSession.starting_balance.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Starting Balance</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">P&L</div>
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
                  <div className="text-2xl font-bold">{sessionStats.requiredAvgMulti.toFixed(1)}x</div>
                  <div className="text-sm text-muted-foreground">Required Avg</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${sessionStats.isProfit ? 'text-green-600' : 'text-yellow-600'}`}>
                    {sessionStats.isProfit ? 'Profit' : `${sessionStats.currentAvgMulti.toFixed(1)}x`}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Avg</div>
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
          {activeSession.status === 'active' && !activeSession.bonus_opening_phase && (
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

          {/* Bonus Opening Interface */}
          {activeSession.status === 'active' && activeSession.bonus_opening_phase && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-kick-purple" />
                  Bonus Opening Phase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{openedBets.length}</div>
                    <div className="text-sm text-muted-foreground">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{sessionBets.length - openedBets.length}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-kick-green">${totalPayouts.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Payouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{currentAvgMulti.toFixed(2)}x</div>
                    <div className="text-sm text-muted-foreground">Current Avg</div>
                  </div>
                </div>

                {selectedBetForPayout ? (
                  <div className="p-4 border rounded-lg bg-card/50 border-primary/20">
                    <h4 className="font-semibold mb-3 text-primary">Record Payout for {selectedBetForPayout.slots?.name}</h4>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="payoutAmount">Payout Amount</Label>
                        <Input
                          id="payoutAmount"
                          type="number"
                          step="0.01"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button onClick={recordPayout} disabled={!payoutAmount} className="bg-kick-green hover:bg-kick-green/80">
                          <Trophy className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedBetForPayout(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : editingPayout ? (
                  <div className="p-4 border rounded-lg bg-card/50 border-accent/20">
                    <h4 className="font-semibold mb-3 text-accent">Edit Payout for {editingPayout.slots?.name}</h4>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="newPayoutAmount">Payout Amount</Label>
                        <Input
                          id="newPayoutAmount"
                          type="number"
                          step="0.01"
                          value={newPayoutAmount}
                          onChange={(e) => setNewPayoutAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button onClick={editPayout} disabled={!newPayoutAmount} className="bg-accent hover:bg-accent/80">
                          <Trophy className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                        <Button variant="outline" onClick={() => setEditingPayout(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">Select a bonus to record its payout</p>
                  </div>
                )}
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
                    <div 
                      key={bet.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        activeSession?.bonus_opening_phase && !bet.payout_recorded_at
                          ? 'cursor-pointer hover:bg-primary/10 border-primary/30' 
                          : ''
                      } ${bet.payout_recorded_at ? 'bg-kick-green/20 border-kick-green/40' : 'border-border'}`}
                      onClick={() => {
                        if (activeSession?.bonus_opening_phase && !bet.payout_recorded_at) {
                          setSelectedBetForPayout(bet);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {bet.slots?.name}
                          {bet.payout_recorded_at && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Trophy className="h-3 w-3 mr-1" />
                              Opened
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{bet.slots?.provider}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${bet.bet_size.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {bet.bonus_multiplier ? `${bet.bonus_multiplier.toFixed(1)}x` : '0x'}
                        </div>
                      </div>
                      {bet.payout_recorded_at && bet.payout_amount ? (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              ${bet.payout_amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(bet.payout_amount / bet.bet_size).toFixed(1)}x
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPayout(bet);
                              setNewPayoutAmount(bet.payout_amount?.toString() || '');
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right ml-4">
                          <div className={`font-medium ${bet.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {bet.pnl >= 0 ? '+' : ''}${bet.pnl.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(bet.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      )}
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

      {/* Overlay Customization Dialog */}
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Bonus Hunt Overlay Customization
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Color Presets */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">🎨 Color Themes</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyColorPreset(preset)}
                  className="group relative p-3 rounded-lg border-2 border-border hover:border-primary transition-all duration-200 hover:scale-105 min-h-[60px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 flex-shrink-0">
                      <div 
                        className="w-4 h-4 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: preset.background.replace('0.95', '1') }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: preset.border }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="text-sm font-medium truncate">{preset.name}</span>
                  </div>
                  <div 
                    className="absolute inset-0 rounded-lg opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: preset.accent }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">🎯 Custom Colors</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2 flex-wrap">
                  <span>Background Color</span>
                  <div 
                    className="w-4 h-4 rounded border flex-shrink-0"
                    style={{ backgroundColor: overlaySettings.background_color.includes('rgba') ? '#000000' : overlaySettings.background_color }}
                  />
                </Label>
                <Input
                  type="color"
                  value={overlaySettings.background_color.includes('rgba') ? '#000000' : overlaySettings.background_color}
                  onChange={(e) => setOverlaySettings({...overlaySettings, background_color: e.target.value})}
                  className="h-12 cursor-pointer w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2 flex-wrap">
                  <span>Border Color</span>
                  <div 
                    className="w-4 h-4 rounded border flex-shrink-0"
                    style={{ backgroundColor: overlaySettings.border_color }}
                  />
                </Label>
                <Input
                  type="color"
                  value={overlaySettings.border_color}
                  onChange={(e) => setOverlaySettings({...overlaySettings, border_color: e.target.value})}
                  className="h-12 cursor-pointer w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2 flex-wrap">
                  <span>Text Color</span>
                  <div 
                    className="w-4 h-4 rounded border flex-shrink-0"
                    style={{ backgroundColor: overlaySettings.text_color }}
                  />
                </Label>
                <Input
                  type="color"
                  value={overlaySettings.text_color}
                  onChange={(e) => setOverlaySettings({...overlaySettings, text_color: e.target.value})}
                  className="h-12 cursor-pointer w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2 flex-wrap">
                  <span>Accent Color</span>
                  <div 
                    className="w-4 h-4 rounded border flex-shrink-0"
                    style={{ backgroundColor: overlaySettings.accent_color }}
                  />
                </Label>
                <Input
                  type="color"
                  value={overlaySettings.accent_color}
                  onChange={(e) => setOverlaySettings({...overlaySettings, accent_color: e.target.value})}
                  className="h-12 cursor-pointer w-full"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">👀 Preview</Label>
            <div 
              className="p-4 rounded-lg border-2 min-h-[100px] flex items-center justify-center text-center transition-all duration-300 w-full"
              style={{
                backgroundColor: overlaySettings.show_background ? overlaySettings.background_color : 'transparent',
                borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent',
                color: overlaySettings.text_color
              }}
            >
              <div className="space-y-2 w-full">
                <div 
                  className="font-semibold"
                  style={{ 
                    fontSize: overlaySettings.font_size === 'small' ? '14px' : overlaySettings.font_size === 'large' ? '18px' : '16px',
                    color: overlaySettings.accent_color 
                  }}
                >
                  🎁 Bonus Hunt Queue
                </div>
                <div style={{ color: overlaySettings.text_color, fontSize: '14px' }} className="break-words">
                  Morning Hunt: Sweet Bonanza ($10.00)
                </div>
              </div>
            </div>
          </div>
          
          {/* Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">⚙️ Display Settings</Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select value={overlaySettings.font_size} onValueChange={(value) => setOverlaySettings({...overlaySettings, font_size: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Max Visible Bonuses</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={overlaySettings.max_visible_bonuses}
                  onChange={(e) => setOverlaySettings({...overlaySettings, max_visible_bonuses: parseInt(e.target.value) || 5})}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Scrolling Speed (ms)</Label>
                <Input
                  type="number"
                  min="10"
                  max="500"
                  value={overlaySettings.scrolling_speed}
                  onChange={(e) => setOverlaySettings({...overlaySettings, scrolling_speed: parseInt(e.target.value) || 50})}
                  className="w-full"
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">Lower = faster scroll, Higher = slower scroll</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-background"
                  checked={overlaySettings.show_background}
                  onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_background: checked === true})}
                />
                <Label htmlFor="show-background">Show Background</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-borders"
                  checked={overlaySettings.show_borders}
                  onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_borders: checked === true})}
                />
                <Label htmlFor="show-borders">Show Borders</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="animation-enabled"
                  checked={overlaySettings.animation_enabled}
                  onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, animation_enabled: checked === true})}
                />
                <Label htmlFor="animation-enabled">Enable Animations</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-expected-payouts"
                  checked={overlaySettings.show_expected_payouts}
                  onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_expected_payouts: checked === true})}
                />
                <Label htmlFor="show-expected-payouts">Show Expected Payouts</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-upcoming-bonuses"
                  checked={overlaySettings.show_upcoming_bonuses}
                  onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_upcoming_bonuses: checked === true})}
                />
                <Label htmlFor="show-upcoming-bonuses">Show Upcoming Bonuses</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-top-multipliers"
                  checked={overlaySettings.show_top_multipliers}
                  onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_top_multipliers: checked === true})}
                />
                <Label htmlFor="show-top-multipliers">Show Top Multipliers</Label>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 pt-4 border-t">
            <Button onClick={saveOverlaySettings} className="w-full">
              💾 Save Overlay Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </div>
  );
}