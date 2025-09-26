import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, FabricText } from 'fabric';
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
  Trash2
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
  {
    id: 'stats-box',
    type: 'data',
    name: 'Stats Box',
    icon: BarChart3,
    properties: {
      width: 150,
      height: 80,
      dataSource: 'totalCalls',
      backgroundColor: 'rgba(0,0,0,0.8)',
      textColor: '#ffffff',
      fontSize: 18
    }
  },
  {
    id: 'participant-counter',
    type: 'data',
    name: 'Participant Count',
    icon: Users,
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
    id: 'timer',
    type: 'data',
    name: 'Timer',
    icon: Clock,
    properties: {
      width: 100,
      height: 50,
      dataSource: 'timer',
      backgroundColor: 'rgba(239,68,68,0.9)',
      textColor: '#ffffff',
      fontSize: 14
    }
  }
];

export default function TestOverlayBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [overlayType, setOverlayType] = useState<'slots' | 'bonus_hunt'>('slots');
  const [layoutName, setLayoutName] = useState('');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1920,
      height: 1080,
      backgroundColor: 'transparent',
    });

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
  }, []);

  const addElement = (elementType: OverlayElement) => {
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
          rx: 8,
          ry: 8,
        });

        const text = new FabricText(`${elementType.name}: 0`, {
          fontSize: elementType.properties.fontSize,
          fill: elementType.properties.textColor,
          originX: 'center',
          originY: 'center',
          left: elementType.properties.width / 2,
          top: elementType.properties.height / 2,
        });

        fabricObject = new Rect({
          left: 100,
          top: 100,
          width: elementType.properties.width,
          height: elementType.properties.height,
          fill: elementType.properties.backgroundColor,
          rx: 8,
          ry: 8,
        });
        break;

      default:
        return;
    }

    if (fabricObject) {
      fabricObject.set({
        elementType: elementType.id,
        elementData: elementType.properties,
      });
      fabricCanvas.add(fabricObject);
      fabricCanvas.setActiveObject(fabricObject);
      fabricCanvas.renderAll();
      toast.success(`Added ${elementType.name}`);
    }
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

        <div className="grid grid-cols-12 gap-6 h-[800px]">
          {/* Element Palette - Left Panel */}
          <Card className="col-span-3 p-4">
            <h3 className="font-semibold mb-4">Elements</h3>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-2">
                {elementLibrary.filter(el => el.type === 'text' || el.type === 'shape').map((element) => (
                  <Button
                    key={element.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addElement(element)}
                  >
                    <element.icon className="h-4 w-4 mr-2" />
                    {element.name}
                  </Button>
                ))}
              </TabsContent>
              
              <TabsContent value="data" className="space-y-2">
                {elementLibrary.filter(el => el.type === 'data').map((element) => (
                  <Button
                    key={element.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addElement(element)}
                  >
                    <element.icon className="h-4 w-4 mr-2" />
                    {element.name}
                  </Button>
                ))}
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-2">
                <p className="text-sm text-muted-foreground">Templates coming soon...</p>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Canvas - Center Panel */}
          <Card className="col-span-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Canvas (1920x1080)</h3>
              <Badge variant="secondary">
                <Eye className="h-3 w-3 mr-1" />
                Live Preview
              </Badge>
            </div>
            <div className="border border-border rounded-lg overflow-hidden bg-gray-900">
              <canvas 
                ref={canvasRef} 
                className="max-w-full max-h-[600px] object-contain" 
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  aspectRatio: '16/9'
                }}
              />
            </div>
          </Card>

          {/* Properties Panel - Right Panel */}
          <Card className="col-span-3 p-4">
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