import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, FabricText, Group } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Square, 
  Circle as CircleIcon, 
  BarChart3, 
  Users, 
  Clock,
  Save,
  Upload,
  Download,
  Eye,
  Trash2,
  Trophy,
  TrendingUp,
  Target,
  Gift,
  DollarSign,
  Zap,
  Star,
  Timer,
  UserCheck,
  Award,
  Hash,
  Crown,
  Coins,
  Calculator,
  TrendingDown,
  Activity,
  Percent,
  Plus
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';

interface OverlayElement {
  id: string;
  type: 'text' | 'shape' | 'data' | 'container';
  name: string;
  icon: any;
  properties: {
    [key: string]: any;
  };
}

const elementLibrary: OverlayElement[] = [
  // Basic Elements
  {
    id: 'text',
    type: 'text',
    name: 'Text Label',
    icon: Type,
    properties: {
      text: 'Sample Text',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#ffffff',
      fontWeight: 'normal'
    }
  },
  {
    id: 'rectangle',
    type: 'shape',
    name: 'Rectangle',
    icon: Square,
    properties: {
      width: 200,
      height: 100,
      fill: '#3b82f6',
      stroke: '#ffffff',
      strokeWidth: 2
    }
  },
  {
    id: 'circle',
    type: 'shape',
    name: 'Circle',
    icon: CircleIcon,
    properties: {
      radius: 50,
      fill: '#10b981',
      stroke: '#ffffff',
      strokeWidth: 2
    }
  },
  
  // Slots Overlay Elements
  {
    id: 'total-calls',
    type: 'data',
    name: 'Total Calls',
    icon: Users,
    properties: {
      width: 140,
      height: 70,
      dataSource: 'totalCalls',
      backgroundColor: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)',
      textColor: '#22c55e',
      fontSize: 18,
      label: 'Total',
      borderColor: 'rgba(34,197,94,0.3)',
      borderWidth: 1,
      shadow: '0 4px 12px rgba(34,197,94,0.2)'
    }
  },
  {
    id: 'completed-calls',
    type: 'data',
    name: 'Completed Calls',
    icon: Trophy,
    properties: {
      width: 140,
      height: 70,
      dataSource: 'completedCalls',
      backgroundColor: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
      textColor: '#3b82f6',
      fontSize: 18,
      label: 'Done',
      borderColor: 'rgba(59,130,246,0.3)',
      borderWidth: 1,
      shadow: '0 4px 12px rgba(59,130,246,0.2)'
    }
  },
  {
    id: 'pending-calls',
    type: 'data',
    name: 'Pending Calls',
    icon: Clock,
    properties: {
      width: 140,
      height: 70,
      dataSource: 'pendingCalls',
      backgroundColor: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
      textColor: '#f59e0b',
      fontSize: 18,
      label: 'Pending',
      borderColor: 'rgba(245,158,11,0.3)',
      borderWidth: 1,
      shadow: '0 4px 12px rgba(245,158,11,0.2)'
    }
  },
  {
    id: 'top-multiplier',
    type: 'data',
    name: 'Top Multiplier',
    icon: TrendingUp,
    properties: {
      width: 140,
      height: 60,
      dataSource: 'topMultiplier',
      backgroundColor: 'rgba(34,197,94,0.1)',
      textColor: '#22c55e',
      fontSize: 16,
      label: 'Top Win'
    }
  },
  {
    id: 'event-title',
    type: 'data',
    name: 'Event Title',
    icon: Star,
    properties: {
      width: 300,
      height: 50,
      dataSource: 'eventTitle',
      backgroundColor: 'transparent',
      textColor: '#ffffff',
      fontSize: 24,
      fontWeight: 'bold'
    }
  },
  {
    id: 'event-status',
    type: 'data',
    name: 'Event Status',
    icon: Activity,
    properties: {
      width: 200,
      height: 40,
      dataSource: 'eventStatus',
      backgroundColor: 'rgba(34,197,94,0.9)',
      textColor: '#000000',
      fontSize: 14,
      borderRadius: 20
    }
  },

  // Bonus Hunt Elements
  {
    id: 'total-bonuses',
    type: 'data',
    name: 'Total Bonuses',
    icon: Gift,
    properties: {
      width: 120,
      height: 80,
      dataSource: 'totalBonuses',
      backgroundColor: 'rgba(245,158,11,0.1)',
      textColor: '#f59e0b',
      fontSize: 16,
      label: 'Total'
    }
  },
  {
    id: 'profit-loss',
    type: 'data',
    name: 'Profit/Loss',
    icon: DollarSign,
    properties: {
      width: 140,
      height: 60,
      dataSource: 'profitLoss',
      backgroundColor: 'rgba(34,197,94,0.1)',
      textColor: '#22c55e',
      fontSize: 16,
      label: 'P&L'
    }
  },
  {
    id: 'current-avg',
    type: 'data',
    name: 'Current Average',
    icon: Calculator,
    properties: {
      width: 140,
      height: 60,
      dataSource: 'currentAvg',
      backgroundColor: 'rgba(59,130,246,0.1)',
      textColor: '#3b82f6',
      fontSize: 16,
      label: 'Current Avg'
    }
  },
  {
    id: 'required-avg',
    type: 'data',
    name: 'Required Average',
    icon: Target,
    properties: {
      width: 140,
      height: 60,
      dataSource: 'requiredAvg',
      backgroundColor: 'rgba(245,158,11,0.1)',
      textColor: '#f59e0b',
      fontSize: 16,
      label: 'Required Avg'
    }
  },
  {
    id: 'currently-opening',
    type: 'data',
    name: 'Currently Opening',
    icon: Zap,
    properties: {
      width: 200,
      height: 80,
      dataSource: 'currentlyOpening',
      backgroundColor: 'rgba(139,92,246,0.1)',
      textColor: '#8b5cf6',
      fontSize: 14,
      borderStyle: 'dashed'
    }
  },

  // Additional Stats Elements
  {
    id: 'win-rate',
    type: 'data',
    name: 'Win Rate',
    icon: Percent,
    properties: {
      width: 120,
      height: 60,
      dataSource: 'winRate',
      backgroundColor: 'rgba(34,197,94,0.1)',
      textColor: '#22c55e',
      fontSize: 16,
      label: 'Win Rate'
    }
  },
  {
    id: 'avg-bet',
    type: 'data',
    name: 'Average Bet',
    icon: Coins,
    properties: {
      width: 120,
      height: 60,
      dataSource: 'avgBet',
      backgroundColor: 'rgba(245,158,11,0.1)',
      textColor: '#f59e0b',
      fontSize: 16,
      label: 'Avg Bet'
    }
  },
  {
    id: 'biggest-win',
    type: 'data',
    name: 'Biggest Win',
    icon: Crown,
    properties: {
      width: 140,
      height: 60,
      dataSource: 'biggestWin',
      backgroundColor: 'rgba(255,215,0,0.1)',
      textColor: '#ffd700',
      fontSize: 16,
      label: 'Big Win'
    }
  },
  {
    id: 'timer',
    type: 'data',
    name: 'Timer',
    icon: Timer,
    properties: {
      width: 100,
      height: 50,
      dataSource: 'timer',
      backgroundColor: 'rgba(239,68,68,0.9)',
      textColor: '#ffffff',
      fontSize: 14
    }
  },
  {
    id: 'participant-counter',
    type: 'data',
    name: 'Participant Count',
    icon: UserCheck,
    properties: {
      width: 120,
      height: 60,
      dataSource: 'participants',
      backgroundColor: 'rgba(59,130,246,0.9)',
      textColor: '#ffffff',
      fontSize: 16
    }
  },
  {
    id: 'call-list',
    type: 'container',
    name: 'Call List Container',
    icon: BarChart3,
    properties: {
      width: 400,
      height: 300,
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderColor: '#374151',
      borderWidth: 1
    }
  },
  {
    id: 'bonus-grid',
    type: 'container',
    name: 'Bonus Grid Container',
    icon: Hash,
    properties: {
      width: 600,
      height: 400,
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderColor: '#374151',
      borderWidth: 1
    }
  }
];

export default function TestOverlayBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [overlayType, setOverlayType] = useState<'slots' | 'bonus_hunt'>('slots');
  const [layoutName, setLayoutName] = useState('');
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 'transparent',
      selection: true, // Enable selection
      preserveObjectStacking: true,
    });

    // Enable interactive features
    canvas.selection = true;
    canvas.skipTargetFind = false;

    canvas.on('selection:created', (e) => {
      setSelectedElement(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedElement(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedElement(null);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [canvasWidth, canvasHeight]);

  // Demo data for different overlay types
  const getDemoData = (dataSource: string) => {
    const demoData: { [key: string]: string } = {
      totalCalls: '47',
      completedCalls: '23',
      pendingCalls: '24',
      topMultiplier: '847x',
      eventTitle: 'Slots Marathon Stream',
      eventStatus: 'LIVE',
      totalBonuses: '12',
      profitLoss: '+$2,847',
      currentAvg: '127x',
      requiredAvg: '250x',
      currentlyOpening: 'Sweet Bonanza',
      winRate: '43%',
      avgBet: '$5.50',
      biggestWin: '$12,500',
      timer: '02:47:15',
      participants: '1,247'
    };
    return demoData[dataSource] || '0';
  };

  // Template configurations
  const templates = {
    'slots-modern': {
      name: 'Modern Slots Overlay',
      description: 'Clean and modern layout for slots calls',
      elements: [
        { type: 'total-calls', x: 50, y: 50 },
        { type: 'completed-calls', x: 220, y: 50 },
        { type: 'pending-calls', x: 390, y: 50 },
        { type: 'top-multiplier', x: 560, y: 50 },
        { type: 'event-title', x: 50, y: 150 },
        { type: 'event-status', x: 400, y: 150 },
        { type: 'call-list', x: 50, y: 220 }
      ]
    },
    'bonus-hunt-classic': {
      name: 'Classic Bonus Hunt',
      description: 'Traditional bonus hunt layout with all stats',
      elements: [
        { type: 'total-bonuses', x: 50, y: 50 },
        { type: 'profit-loss', x: 200, y: 50 },
        { type: 'current-avg', x: 370, y: 50 },
        { type: 'required-avg', x: 540, y: 50 },
        { type: 'currently-opening', x: 50, y: 150 },
        { type: 'biggest-win', x: 280, y: 150 },
        { type: 'win-rate', x: 450, y: 150 },
        { type: 'bonus-grid', x: 50, y: 250 }
      ]
    },
    'minimal-stats': {
      name: 'Minimal Stats',
      description: 'Clean minimal overlay with essential stats only',
      elements: [
        { type: 'total-calls', x: 50, y: 50 },
        { type: 'completed-calls', x: 220, y: 50 },
        { type: 'top-multiplier', x: 390, y: 50 },
        { type: 'timer', x: 560, y: 50 }
      ]
    }
  };

  const loadTemplate = (templateKey: string) => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    setActiveTemplate(templateKey);
    
    const template = templates[templateKey as keyof typeof templates];
    if (!template) return;

    template.elements.forEach(elementConfig => {
      const elementType = elementLibrary.find(el => el.id === elementConfig.type);
      if (elementType) {
        addElementAtPosition(elementType, elementConfig.x, elementConfig.y);
      }
    });
    
    toast.success(`Loaded ${template.name} template`);
  };

  const addElementAtPosition = (elementType: OverlayElement, x: number, y: number) => {
    if (!fabricCanvas) return;

    let fabricObject;

    switch (elementType.type) {
      case 'text':
        fabricObject = new FabricText(elementType.properties.text, {
          left: 100,
          top: 100,
          fontSize: elementType.properties.fontSize,
          fill: elementType.properties.fill,
          fontFamily: elementType.properties.fontFamily,
        });
        break;

      case 'shape':
        if (elementType.id === 'rectangle') {
          fabricObject = new Rect({
            left: 100,
            top: 100,
            width: elementType.properties.width,
            height: elementType.properties.height,
            fill: elementType.properties.fill,
            stroke: elementType.properties.stroke,
            strokeWidth: elementType.properties.strokeWidth,
          });
        } else if (elementType.id === 'circle') {
          fabricObject = new Circle({
            left: 100,
            top: 100,
            radius: elementType.properties.radius,
            fill: elementType.properties.fill,
            stroke: elementType.properties.stroke,
            strokeWidth: elementType.properties.strokeWidth,
          });
        }
        break;

      case 'data':
        // Create a group with background and text for data elements
        const bg = new Rect({
          width: elementType.properties.width,
          height: elementType.properties.height,
          fill: elementType.properties.backgroundColor,
          rx: elementType.properties.borderRadius || 8,
          ry: elementType.properties.borderRadius || 8,
          stroke: elementType.properties.borderColor,
          strokeWidth: elementType.properties.borderWidth || 0,
        });

        const demoValue = getDemoData(elementType.properties.dataSource);
        const displayText = elementType.properties.label 
          ? `${elementType.properties.label}: ${demoValue}`
          : demoValue;

        const text = new FabricText(displayText, {
          fontSize: elementType.properties.fontSize,
          fill: elementType.properties.textColor,
          originX: 'center',
          originY: 'center',
          left: elementType.properties.width / 2,
          top: elementType.properties.height / 2,
          fontWeight: elementType.properties.fontWeight || 'normal',
          textAlign: 'center',
        });

        // Create a group to keep text and background together
        fabricObject = new Group([bg, text], {
          left: 100,
          top: 100,
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });
        break;

      case 'container':
        fabricObject = new Rect({
          left: 100,
          top: 100,
          width: elementType.properties.width,
          height: elementType.properties.height,
          fill: elementType.properties.backgroundColor,
          stroke: elementType.properties.borderColor,
          strokeWidth: elementType.properties.borderWidth || 1,
          strokeDashArray: elementType.properties.borderStyle === 'dashed' ? [5, 5] : undefined,
          rx: 8,
          ry: 8,
        });
        break;
      default:
        return;
    }

    if (fabricObject) {
      // Enable interaction for all objects
      fabricObject.set({
        elementType: elementType.id,
        elementData: elementType.properties,
        selectable: true,
        moveable: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        evented: true,
      });
      
      
      fabricCanvas.add(fabricObject);
      fabricCanvas.setActiveObject(fabricObject);
      fabricCanvas.renderAll();
      toast.success(`Added ${elementType.name}`);
    }
  };

  const addElement = (elementType: OverlayElement) => {
    addElementAtPosition(elementType, 100, 100);
  };

  const updateSelectedElement = (property: string, value: any) => {
    if (!selectedElement || !fabricCanvas) return;

    selectedElement.set(property, value);
    fabricCanvas.renderAll();
  };

  const deleteSelectedElement = () => {
    if (!selectedElement || !fabricCanvas) return;

    fabricCanvas.remove(selectedElement);
    setSelectedElement(null);
    toast.success('Element deleted');
  };

  const saveLayout = () => {
    if (!fabricCanvas || !layoutName.trim()) {
      toast.error('Please enter a layout name');
      return;
    }

    const layoutConfig = fabricCanvas.toJSON();
    
    // Here you would save to the database
    console.log('Saving layout:', {
      name: layoutName,
      type: overlayType,
      config: layoutConfig
    });
    
    toast.success('Layout saved successfully');
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'transparent';
    fabricCanvas.renderAll();
    setSelectedElement(null);
    toast.success('Canvas cleared');
  };

  const exportLayout = () => {
    if (!fabricCanvas) return;
    
    const layoutConfig = fabricCanvas.toJSON();
    const dataStr = JSON.stringify(layoutConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layoutName || 'overlay-layout'}.json`;
    link.click();
    
    toast.success('Layout exported');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-background to-muted border-b">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Test Overlay Builder</h1>
          <p className="text-muted-foreground">Create custom overlays with drag-and-drop interface (Admin Only)</p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Top Controls */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="overlay-type">Overlay Type:</Label>
              <Select value={overlayType} onValueChange={(value: 'slots' | 'bonus_hunt') => setOverlayType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slots">Slots</SelectItem>
                  <SelectItem value="bonus_hunt">Bonus Hunt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <Label htmlFor="layout-name">Layout Name:</Label>
              <Input
                id="layout-name"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="My Custom Layout"
                className="w-48"
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <Button onClick={saveLayout} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={exportLayout} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={clearCanvas} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-12 gap-6 min-h-[700px]">
          {/* Element Palette - Left Panel */}
          <Card className="col-span-3 p-4">
            <h3 className="font-semibold mb-4">Elements</h3>
            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full grid-cols-5 text-xs">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="slots">Slots</TabsTrigger>
                <TabsTrigger value="bonus">Bonus</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="templates" className="space-y-3">
                {Object.entries(templates).map(([key, template]) => (
                  <div key={key} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => loadTemplate(key)}
                    >
                      Load Template
                    </Button>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="basic" className="space-y-2">
                {elementLibrary.filter(el => el.type === 'text' || el.type === 'shape' || el.type === 'container').map((element) => (
                  <Button
                    key={element.id}
                    variant="outline"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addElement(element)}
                  >
                    <element.icon className="h-3 w-3 mr-2" />
                    {element.name}
                  </Button>
                ))}
              </TabsContent>
              
              <TabsContent value="slots" className="space-y-2">
                {elementLibrary.filter(el => 
                  ['total-calls', 'completed-calls', 'pending-calls', 'top-multiplier', 'event-title', 'event-status', 'call-list'].includes(el.id)
                ).map((element) => (
                  <Button
                    key={element.id}
                    variant="outline"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addElement(element)}
                  >
                    <element.icon className="h-3 w-3 mr-2" />
                    {element.name}
                  </Button>
                ))}
              </TabsContent>

              <TabsContent value="bonus" className="space-y-2">
                {elementLibrary.filter(el => 
                  ['total-bonuses', 'profit-loss', 'current-avg', 'required-avg', 'currently-opening', 'bonus-grid'].includes(el.id)
                ).map((element) => (
                  <Button
                    key={element.id}
                    variant="outline"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addElement(element)}
                  >
                    <element.icon className="h-3 w-3 mr-2" />
                    {element.name}
                  </Button>
                ))}
              </TabsContent>

              <TabsContent value="stats" className="space-y-2">
                {elementLibrary.filter(el => 
                  ['win-rate', 'avg-bet', 'biggest-win', 'timer', 'participant-counter'].includes(el.id)
                ).map((element) => (
                  <Button
                    key={element.id}
                    variant="outline"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => addElement(element)}
                  >
                    <element.icon className="h-3 w-3 mr-2" />
                    {element.name}
                  </Button>
                ))}
              </TabsContent>
            </Tabs>
          </Card>

          {/* Canvas - Center Panel */}
          {/* Canvas with Responsive Sizing */}
          <Card className="col-span-8 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Canvas ({canvasWidth}x{canvasHeight})</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Resolution:</Label>
                  <Select 
                    value={`${canvasWidth}x${canvasHeight}`} 
                    onValueChange={(value) => {
                      const [w, h] = value.split('x').map(Number);
                      setCanvasWidth(w);
                      setCanvasHeight(h);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="800x600">800x600</SelectItem>
                      <SelectItem value="1280x720">1280x720</SelectItem>
                      <SelectItem value="1920x1080">1920x1080</SelectItem>
                      <SelectItem value="2560x1440">2560x1440</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="secondary">
                  <Eye className="h-3 w-3 mr-1" />
                  Live Preview
                </Badge>
              </div>
            </div>
            <div className="border border-border rounded-lg overflow-auto bg-gray-900 p-4 max-h-[70vh]">
              <div className="w-fit mx-auto">
                <canvas 
                  ref={canvasRef} 
                  className="cursor-default border border-gray-600" 
                  style={{ 
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Properties Panel - Right Panel */}
          <Card className="col-span-4 p-4">
            <h3 className="font-semibold mb-4">Properties</h3>
            {selectedElement ? (
              <div className="space-y-4">
                <div>
                  <Label>Position</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.left || 0)}
                        onChange={(e) => updateSelectedElement('left', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElement.top || 0)}
                        onChange={(e) => updateSelectedElement('top', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Size</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                value={Math.round((selectedElement.width || 0) * (selectedElement.scaleX || 1))}
                onChange={(e) => updateSelectedElement('width', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input
                        type="number"
                value={Math.round((selectedElement.height || 0) * (selectedElement.scaleY || 1))}
                onChange={(e) => updateSelectedElement('height', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {selectedElement.type === 'textbox' && (
                  <div>
                    <Label>Text Properties</Label>
                    <div className="space-y-2 mt-1">
                      <Input
                        placeholder="Text content"
                        value={selectedElement.text || ''}
                        onChange={(e) => updateSelectedElement('text', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Font size"
                        value={selectedElement.fontSize || 16}
                        onChange={(e) => updateSelectedElement('fontSize', parseFloat(e.target.value))}
                      />
                      <Input
                        type="color"
                        value={selectedElement.fill || '#ffffff'}
                        onChange={(e) => updateSelectedElement('fill', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={deleteSelectedElement}
                  variant="destructive" 
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Element
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select an element to edit its properties
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}