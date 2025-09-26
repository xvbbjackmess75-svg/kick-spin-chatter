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

interface SlotsCall {
  id: string;
  slot_name: string;
  call_order: number;
  status: string;
  viewer_username: string;
  win_amount?: number;
  multiplier?: number;
}

export default function TestSlotsOverlay() {
  const [searchParams] = useSearchParams();
  const [layout, setLayout] = useState<TestOverlayLayout | null>(null);
  const [calls, setCalls] = useState<SlotsCall[]>([]);
  const [customUserId, setCustomUserId] = useState('');
  const layoutId = searchParams.get('layout');
  const userId = searchParams.get('user') || customUserId;

  useEffect(() => {
    if (layoutId) {
      loadLayout();
    }
    if (userId) {
      loadSlotsData();
    }
  }, [layoutId, userId]);

  const loadLayout = async () => {
    if (!layoutId) return;

    try {
      const { data, error } = await supabase
        .from('test_overlay_layouts')
        .select('*')
        .eq('id', layoutId)
        .eq('type', 'slots')
        .single();

      if (error) throw error;
      setLayout(data);
    } catch (error) {
      console.error('Error loading layout:', error);
      toast.error('Failed to load overlay layout');
    }
  };

  const loadSlotsData = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_overlay_slots_calls', { target_user_id: userId });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error loading slots data:', error);
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

  if (!layout) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Test Slots Overlay</h2>
          
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
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Test Slots Overlay</h2>
          <p className="text-sm opacity-75">Layout: {layout.name}</p>
          <p className="text-sm opacity-75">Calls: {calls.length}</p>
          
          {calls.slice(0, 5).map((call, index) => (
            <div key={call.id} className="mt-2 p-2 bg-white/10 rounded">
              <div className="flex items-center justify-between">
                <span className="font-medium">{call.slot_name}</span>
                <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                  {call.status}
                </Badge>
              </div>
              <div className="text-sm opacity-75">
                {call.viewer_username} • Order: {call.call_order}
              </div>
              {call.win_amount && (
                <div className="text-sm text-green-400">
                  Win: ${call.win_amount} ({call.multiplier}x)
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Debug info */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
        <div>Layout ID: {layout.id}</div>
        <div>Elements: {layout.layout_config?.objects?.length || 0}</div>
        <div>User ID: {userId || 'None'}</div>
        <div>Calls: {calls.length}</div>
      </div>
    </div>
  );
}