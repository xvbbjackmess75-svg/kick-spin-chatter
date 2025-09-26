import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestOverlayLayout {
  id: string;
  name: string;
  layout_config: any;
  created_at: string;
}

interface BonusHuntSession {
  id: string;
  session_name: string;
  starting_balance: number;
  current_balance: number;
  target_bonuses: number;
  status: string;
}

interface BonusHuntBet {
  id: string;
  slot_id: string;
  bet_size: number;
  payout_amount?: number;
  bonus_multiplier?: number;
  pnl: number;
}

export default function TestBonusHuntOverlay() {
  const [searchParams] = useSearchParams();
  const [layout, setLayout] = useState<TestOverlayLayout | null>(null);
  const [session, setSession] = useState<BonusHuntSession | null>(null);
  const [bets, setBets] = useState<BonusHuntBet[]>([]);
  const [customUserId, setCustomUserId] = useState('');
  const layoutId = searchParams.get('layout');
  const userId = searchParams.get('user') || customUserId;

  useEffect(() => {
    if (layoutId) {
      loadLayout();
    }
    if (userId) {
      loadBonusHuntData();
    }
  }, [layoutId, userId]);

  const loadLayout = async () => {
    if (!layoutId) return;

    try {
      const { data, error } = await supabase
        .from('test_overlay_layouts')
        .select('*')
        .eq('id', layoutId)
        .eq('type', 'bonus_hunt')
        .single();

      if (error) throw error;
      setLayout(data);
    } catch (error) {
      console.error('Error loading layout:', error);
      toast.error('Failed to load overlay layout');
    }
  };

  const loadBonusHuntData = async () => {
    if (!userId) return;

    try {
      // Load active session
      const { data: sessionData, error: sessionError } = await supabase
        .from('bonus_hunt_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      setSession(sessionData);

      if (sessionData) {
        // Load bets for the session
        const { data: betsData, error: betsError } = await supabase
          .from('bonus_hunt_bets')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('created_at', { ascending: false });

        if (betsError) throw betsError;
        setBets(betsData || []);
      }
    } catch (error) {
      console.error('Error loading bonus hunt data:', error);
    }
  };

  const renderLayoutElement = (element: any, index: number) => {
    const style = {
      position: 'absolute' as const,
      left: element.left || 0,
      top: element.top || 0,
      width: element.width || 'auto',
      height: element.height || 'auto',
      transform: element.scaleX || element.scaleY ? 
        `scale(${element.scaleX || 1}, ${element.scaleY || 1})` : 
        undefined,
    };

    switch (element.type) {
      case 'textbox':
        return (
          <div
            key={index}
            style={{
              ...style,
              fontSize: element.fontSize || 16,
              color: element.fill || '#ffffff',
              fontFamily: element.fontFamily || 'Arial',
              fontWeight: element.fontWeight || 'normal',
            }}
          >
            {element.text || 'Sample Text'}
          </div>
        );

      case 'rect':
        return (
          <div
            key={index}
            style={{
              ...style,
              backgroundColor: element.fill || 'transparent',
              border: element.stroke ? `${element.strokeWidth || 1}px solid ${element.stroke}` : 'none',
              borderRadius: element.rx || 0,
            }}
          />
        );

      case 'circle':
        return (
          <div
            key={index}
            style={{
              ...style,
              backgroundColor: element.fill || 'transparent',
              border: element.stroke ? `${element.strokeWidth || 1}px solid ${element.stroke}` : 'none',
              borderRadius: '50%',
              width: (element.radius || 50) * 2,
              height: (element.radius || 50) * 2,
            }}
          />
        );

      default:
        return null;
    }
  };

  const totalBets = bets.length;
  const completedBets = bets.filter(bet => bet.payout_amount !== null).length;
  const totalWinnings = bets.reduce((sum, bet) => sum + (bet.payout_amount || 0), 0);
  const totalPnl = session ? session.current_balance - session.starting_balance : 0;

  if (!layout) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Test Bonus Hunt Overlay</h2>
          
          {!layoutId && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Add ?layout=LAYOUT_ID to the URL to preview a specific layout
              </p>
              
              <div>
                <Label htmlFor="user-id">Test with specific user ID:</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="user-id"
                    value={customUserId}
                    onChange={(e) => setCustomUserId(e.target.value)}
                    placeholder="Enter user ID"
                  />
                  <Button onClick={() => window.location.href = `?user=${customUserId}`}>
                    Load
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {layoutId && (
            <p className="text-muted-foreground">Loading layout...</p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ 
        width: '1920px', 
        height: '1080px',
        backgroundColor: 'transparent',
        transform: 'scale(0.8)',
        transformOrigin: 'top left'
      }}
    >
      {/* Render layout elements */}
      {layout.layout_config?.objects?.map((element: any, index: number) => 
        renderLayoutElement(element, index)
      )}

      {/* Default fallback content if no custom layout */}
      {(!layout.layout_config?.objects || layout.layout_config.objects.length === 0) && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Test Bonus Hunt Overlay</h2>
          <p className="text-sm opacity-75 mb-4">Layout: {layout.name}</p>
          
          {session ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{session.session_name}</h3>
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded">
                  <div className="text-sm opacity-75">Starting Balance</div>
                  <div className="text-lg font-bold">${session.starting_balance}</div>
                </div>
                <div className="bg-white/10 p-3 rounded">
                  <div className="text-sm opacity-75">Current Balance</div>
                  <div className="text-lg font-bold">${session.current_balance}</div>
                </div>
                <div className="bg-white/10 p-3 rounded">
                  <div className="text-sm opacity-75">Total Bets</div>
                  <div className="text-lg font-bold">{totalBets}</div>
                </div>
                <div className="bg-white/10 p-3 rounded">
                  <div className="text-sm opacity-75">Completed</div>
                  <div className="text-lg font-bold">{completedBets}/{session.target_bonuses}</div>
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded">
                <div className="text-sm opacity-75">Total P&L</div>
                <div className={`text-xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalPnl.toFixed(2)}
                </div>
              </div>

              {bets.slice(0, 3).map((bet, index) => (
                <div key={bet.id} className="bg-white/10 p-2 rounded text-sm">
                  <div className="flex justify-between">
                    <span>Bet #{index + 1}</span>
                    <span>${bet.bet_size}</span>
                  </div>
                  {bet.payout_amount !== null && (
                    <div className="flex justify-between text-green-400">
                      <span>Payout</span>
                      <span>${bet.payout_amount} ({bet.bonus_multiplier}x)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active bonus hunt session</p>
          )}
        </div>
      )}

      {/* Debug info */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
        <div>Layout ID: {layout.id}</div>
        <div>Elements: {layout.layout_config?.objects?.length || 0}</div>
        <div>User ID: {userId || 'None'}</div>
        <div>Session: {session ? session.id : 'None'}</div>
        <div>Bets: {bets.length}</div>
      </div>
    </div>
  );
}