import { useSearchParams } from "react-router-dom";
import SlotsOverlay from "@/components/SlotsOverlay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, Dices, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

interface OverlaySettings {
  background_color: string;
  border_color: string;
  text_color: string;
  accent_color: string;
  font_size: string;
  max_visible_calls: number;
  scrolling_speed: number;
  show_background: boolean;
  show_borders: boolean;
  animation_enabled: boolean;
}

export default function SlotsOverlayPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const maxCalls = parseInt(searchParams.get('maxCalls') || '10');
  const { user } = useAuth();
  
  console.log('🔍 SlotsOverlayPage loaded with:', { userId, maxCalls, user: user?.id });
  
  // Overlay customization states
  const [isOverlayDialogOpen, setIsOverlayDialogOpen] = useState(false);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    background_color: 'rgba(0, 0, 0, 0.95)',
    border_color: '#3b82f6',
    text_color: '#ffffff',
    accent_color: '#3b82f6',
    font_size: 'medium',
    max_visible_calls: 10,
    scrolling_speed: 50,
    show_background: true,
    show_borders: true,
    animation_enabled: true
  });

  useEffect(() => {
    if (userId) {
      fetchOverlaySettings();
    }
  }, [userId]);

  const fetchOverlaySettings = async () => {
    if (!userId) return;

    try {
      console.log('🔍 Fetching overlay settings for userId:', userId);
      
      const { data, error } = await supabase
        .from('overlay_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error("Error fetching overlay settings:", error);
        return;
      }

      if (data) {
        console.log('📊 Fetched overlay settings:', data);
        setOverlaySettings({
          background_color: data.background_color || 'rgba(0, 0, 0, 0.95)',
          border_color: data.border_color || '#3b82f6',
          text_color: data.text_color || '#ffffff',
          accent_color: data.accent_color || '#3b82f6',
          font_size: data.font_size || 'medium',
          max_visible_calls: data.max_visible_calls || 10,
          scrolling_speed: data.scrolling_speed || 50,
          show_background: data.show_background ?? true,
          show_borders: data.show_borders ?? true,
          animation_enabled: data.animation_enabled ?? true
        });
      }
    } catch (error) {
      console.error("Error fetching overlay settings:", error);
    }
  };

  const saveOverlaySettings = async () => {
    if (!user || !userId || user.id !== userId) {
      toast({
        title: "Unauthorized",
        description: "You can only customize your own overlay",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔧 Saving overlay settings for user:', userId);
      console.log('🔧 Current overlay settings state:', overlaySettings);
      
      const settingsToSave = {
        user_id: userId,
        background_color: overlaySettings.background_color,
        border_color: overlaySettings.border_color,
        text_color: overlaySettings.text_color,
        accent_color: overlaySettings.accent_color,
        font_size: overlaySettings.font_size,
        max_visible_calls: overlaySettings.max_visible_calls,
        scrolling_speed: overlaySettings.scrolling_speed,
        show_background: overlaySettings.show_background,
        show_borders: overlaySettings.show_borders,
        animation_enabled: overlaySettings.animation_enabled
      };

      console.log('🔧 Settings to save:', settingsToSave);

      const { error } = await supabase
        .from('overlay_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' });

      if (error) {
        console.error('🚨 Database error saving overlay settings:', error);
        throw error;
      }

      console.log('✅ Overlay settings saved successfully');
      toast({
        title: "Settings saved!",
        description: "Overlay settings saved successfully!",
      });
      setIsOverlayDialogOpen(false);
      
      // Refresh the page to apply changes
      window.location.reload();
    } catch (error) {
      console.error("🚨 Error saving overlay settings:", error);
      toast({
        title: "Error",
        description: "Failed to save overlay settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Settings Button - Only show if user owns this overlay */}
      {user && userId && user.id === userId && (
        <Button
          size="sm"
          className="fixed top-4 right-4 z-50 bg-primary/80 backdrop-blur-sm hover:bg-primary"
          onClick={() => setIsOverlayDialogOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      )}
      
      <div className="p-4">
        <SlotsOverlay userId={userId || undefined} maxCalls={maxCalls} />
      </div>

      {/* Overlay Customization Dialog */}
      <Dialog open={isOverlayDialogOpen} onOpenChange={setIsOverlayDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Slots Call Overlay</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Color Templates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Color Templates</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'rgba(0, 0, 0, 0.95)',
                    border_color: '#3b82f6',
                    text_color: '#ffffff',
                    accent_color: '#3b82f6'
                  })}
                >
                  <div className="w-full h-8 bg-black/95 rounded mb-2 border border-blue-500"></div>
                  <div className="text-sm font-medium">Classic Dark</div>
                </button>
                
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'rgba(16, 185, 129, 0.9)',
                    border_color: '#10b981',
                    text_color: '#ffffff',
                    accent_color: '#fbbf24'
                  })}
                >
                  <div className="w-full h-8 bg-emerald-500/90 rounded mb-2 border border-emerald-500"></div>
                  <div className="text-sm font-medium">Emerald Gold</div>
                </button>
                
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'rgba(139, 69, 19, 0.95)',
                    border_color: '#f59e0b',
                    text_color: '#fbbf24',
                    accent_color: '#f59e0b'
                  })}
                >
                  <div className="w-full h-8 bg-amber-800/95 rounded mb-2 border border-amber-500"></div>
                  <div className="text-sm font-medium">Golden Brown</div>
                </button>
                
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'rgba(30, 41, 59, 0.95)',
                    border_color: '#8b5cf6',
                    text_color: '#e2e8f0',
                    accent_color: '#8b5cf6'
                  })}
                >
                  <div className="w-full h-8 bg-slate-700/95 rounded mb-2 border border-violet-500"></div>
                  <div className="text-sm font-medium">Purple Slate</div>
                </button>
                
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'rgba(220, 38, 127, 0.9)',
                    border_color: '#ec4899',
                    text_color: '#ffffff',
                    accent_color: '#fde047'
                  })}
                >
                  <div className="w-full h-8 bg-pink-600/90 rounded mb-2 border border-pink-500"></div>
                  <div className="text-sm font-medium">Pink Neon</div>
                </button>
                
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'rgba(17, 24, 39, 0.98)',
                    border_color: '#ef4444',
                    text_color: '#f9fafb',
                    accent_color: '#ef4444'
                  })}
                >
                  <div className="w-full h-8 bg-gray-900/98 rounded mb-2 border border-red-500"></div>
                  <div className="text-sm font-medium">Dark Red</div>
                </button>
                
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'transparent',
                    border_color: '#06b6d4',
                    text_color: '#ffffff',
                    accent_color: '#06b6d4',
                    show_background: false
                  })}
                >
                  <div className="w-full h-8 bg-transparent rounded mb-2 border border-cyan-500"></div>
                  <div className="text-sm font-medium">Transparent</div>
                </button>
                
                <button
                  className="p-3 rounded-lg border-2 hover:border-primary transition-colors"
                  onClick={() => setOverlaySettings({
                    ...overlaySettings,
                    background_color: 'rgba(124, 58, 237, 0.9)',
                    border_color: '#a855f7',
                    text_color: '#faf5ff',
                    accent_color: '#22d3ee'
                  })}
                >
                  <div className="w-full h-8 bg-violet-600/90 rounded mb-2 border border-purple-500"></div>
                  <div className="text-sm font-medium">Cyber Purple</div>
                </button>
              </div>
            </div>

            {/* Advanced Color Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={overlaySettings.background_color.includes('rgba') ? '#000000' : overlaySettings.background_color}
                      onChange={(e) => setOverlaySettings({...overlaySettings, background_color: e.target.value})}
                      className="w-16"
                    />
                    <Input
                      type="text"
                      value={overlaySettings.background_color}
                      onChange={(e) => setOverlaySettings({...overlaySettings, background_color: e.target.value})}
                      placeholder="rgba(0, 0, 0, 0.95)"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={overlaySettings.border_color || '#3b82f6'}
                      onChange={(e) => setOverlaySettings({...overlaySettings, border_color: e.target.value})}
                      className="w-16"
                    />
                    <Input
                      type="text"
                      value={overlaySettings.border_color || '#3b82f6'}
                      onChange={(e) => setOverlaySettings({...overlaySettings, border_color: e.target.value})}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={overlaySettings.text_color.includes('hsl') ? '#ffffff' : overlaySettings.text_color}
                      onChange={(e) => setOverlaySettings({...overlaySettings, text_color: e.target.value})}
                      className="w-16"
                    />
                    <Input
                      type="text"
                      value={overlaySettings.text_color}
                      onChange={(e) => setOverlaySettings({...overlaySettings, text_color: e.target.value})}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={overlaySettings.accent_color.includes('hsl') ? '#3b82f6' : overlaySettings.accent_color}
                      onChange={(e) => setOverlaySettings({...overlaySettings, accent_color: e.target.value})}
                      className="w-16"
                    />
                    <Input
                      type="text"
                      value={overlaySettings.accent_color}
                      onChange={(e) => setOverlaySettings({...overlaySettings, accent_color: e.target.value})}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Preview */}
            <div className="space-y-2">
              <Label>Live Preview</Label>
              <div 
                className={`p-4 rounded-lg transition-all duration-300 ${overlaySettings.show_borders ? 'border-2' : 'border-0'}`}
                style={{
                  backgroundColor: overlaySettings.show_background ? overlaySettings.background_color : 'transparent',
                  borderColor: overlaySettings.show_borders ? overlaySettings.border_color : 'transparent',
                  color: overlaySettings.text_color,
                  fontSize: overlaySettings.font_size === 'small' ? '14px' : overlaySettings.font_size === 'large' ? '18px' : '16px'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Dices className="h-6 w-6" style={{ color: overlaySettings.accent_color }} />
                  <h4 className="font-bold text-lg" style={{ color: overlaySettings.text_color }}>
                    Slots Call Event
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-1 rounded" style={{ 
                      backgroundColor: overlaySettings.accent_color + '40', 
                      color: overlaySettings.accent_color 
                    }}>
                      #1
                    </span>
                    <span className="font-medium" style={{ color: overlaySettings.accent_color }}>
                      SampleUser
                    </span>
                    <span>→</span>
                    <span style={{ color: overlaySettings.text_color }}>
                      Sample Slot
                    </span>
                  </div>
                  <div className="text-sm opacity-80">
                    This is how your overlay will look with the current settings
                  </div>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Display Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Font Size</Label>
                  <Select value={overlaySettings.font_size} onValueChange={(value) => setOverlaySettings({...overlaySettings, font_size: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Max Visible Calls</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={overlaySettings.max_visible_calls}
                    onChange={(e) => setOverlaySettings({...overlaySettings, max_visible_calls: parseInt(e.target.value) || 10})}
                  />
                </div>

                <div>
                  <Label>Scrolling Speed (ms)</Label>
                  <Input
                    type="number"
                    min="10"
                    max="200"
                    value={overlaySettings.scrolling_speed || 50}
                    onChange={(e) => setOverlaySettings({...overlaySettings, scrolling_speed: parseInt(e.target.value) || 50})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Show Background</Label>
                  <Switch
                    checked={overlaySettings.show_background ?? true}
                    onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_background: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Borders</Label>
                  <Switch
                    checked={overlaySettings.show_borders ?? true}
                    onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, show_borders: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Animation Enabled</Label>
                  <Switch
                    checked={overlaySettings.animation_enabled}
                    onCheckedChange={(checked) => setOverlaySettings({...overlaySettings, animation_enabled: checked})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveOverlaySettings} className="flex-1">
                Save Overlay Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const testUrl = `/overlay/slots?userId=${userId}&maxCalls=${overlaySettings.max_visible_calls}&cb=${Date.now()}`;
                  window.open(testUrl, '_blank');
                }}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Overlay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}