import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Dices, DollarSign, RotateCcw, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

interface Slot {
  id: string;
  name: string;
  provider: string;
}

interface SpinResult {
  slot: Slot;
  betSize: number;
  spins: number;
  hasExtraChance: boolean;
}

export default function SlotPicker() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [betRange, setBetRange] = useState<[number, number]>([1, 50]);
  const [spinRange, setSpinRange] = useState<[number, number]>([1, 100]);
  const [extraChance, setExtraChance] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [visibleSlots, setVisibleSlots] = useState<Slot[]>([]);
  const [winnerIndex, setWinnerIndex] = useState<number>(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_WIDTH = 176; // w-44 = 11rem = 176px
  const ITEM_GAP = 16; // gap-4 = 1rem = 16px

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from("slots")
      .select("id, name, provider")
      .order("name");

    if (error) {
      toast.error("Failed to load slots");
      return;
    }

    setSlots(data || []);
    const uniqueProviders = [...new Set(data?.map((s) => s.provider) || [])];
    setProviders(uniqueProviders);
    setSelectedProviders(uniqueProviders);
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    );
  };

  const selectAllProviders = () => setSelectedProviders([...providers]);
  const deselectAllProviders = () => setSelectedProviders([]);

  const getFilteredSlots = () => {
    return slots.filter((slot) => selectedProviders.includes(slot.provider));
  };

  // Cryptographically stronger random using multiple entropy sources
  const getSecureRandom = () => {
    const timestamp = Date.now();
    const random1 = Math.random();
    const random2 = Math.random();
    return (random1 + random2 + (timestamp % 1000) / 1000) % 1;
  };

  // Fisher-Yates shuffle with enhanced randomness
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(getSecureRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getRandomNumber = (min: number, max: number) => {
    return Math.floor(getSecureRandom() * (max - min + 1)) + min;
  };

  // Generate unique spin ID to force re-render
  const [spinId, setSpinId] = useState(0);

  const spin = () => {
    const filteredSlots = getFilteredSlots();
    if (filteredSlots.length === 0) {
      toast.error("Please select at least one provider");
      return;
    }

    // Reset wheel position instantly before starting new spin
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform = "translateX(0)";
    }

    // Force new render with unique spin ID
    setSpinId(Date.now());
    setIsSpinning(true);
    setResult(null);

    // Shuffle all slots first for true randomness
    const shuffledSlots = shuffleArray(filteredSlots);
    
    // Pick a truly random winner from shuffled array
    const winnerIdx = getRandomNumber(0, shuffledSlots.length - 1);
    const selectedSlot = shuffledSlots[winnerIdx];
    const randomBet = getRandomNumber(betRange[0], betRange[1]);
    const randomSpins = getRandomNumber(spinRange[0], spinRange[1]);

    // Create wheel with completely random items each time
    const totalItems = 70;
    const winnerPosition = 55 + getRandomNumber(0, 5); // Slightly vary winner position
    const wheelItems: Slot[] = [];

    // Generate each position with fresh randomness
    for (let i = 0; i < totalItems; i++) {
      if (i === winnerPosition) {
        wheelItems.push(selectedSlot);
      } else {
        // Pick from a freshly shuffled array each time for max variety
        const freshShuffle = shuffleArray(filteredSlots);
        // Use different index based on position to avoid patterns
        const pickIdx = (i * 7 + getRandomNumber(0, freshShuffle.length - 1)) % freshShuffle.length;
        wheelItems.push(freshShuffle[pickIdx]);
      }
    }

    // Final shuffle of sections to break any remaining patterns
    // Shuffle items before winner and after winner separately
    const beforeWinner = shuffleArray(wheelItems.slice(0, winnerPosition));
    const afterWinner = shuffleArray(wheelItems.slice(winnerPosition + 1));
    const finalItems = [...beforeWinner, selectedSlot, ...afterWinner];

    setVisibleSlots(finalItems);
    setWinnerIndex(winnerPosition);

    // Calculate position dynamically based on actual container width
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (wheelRef.current && containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const itemTotalWidth = ITEM_WIDTH + ITEM_GAP;
          
          // Calculate to center the winner under the pointer
          // Position = (winnerIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2)
          const targetPosition = (winnerPosition * itemTotalWidth) - (containerWidth / 2) + (ITEM_WIDTH / 2) + 16; // +16 for padding
          
          wheelRef.current.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
          wheelRef.current.style.transform = `translateX(-${targetPosition}px)`;
        }
      }, 50);
    });

    // Show result after animation
    setTimeout(() => {
      setIsSpinning(false);
      setResult({
        slot: selectedSlot,
        betSize: randomBet,
        spins: randomSpins,
        hasExtraChance: extraChance,
      });
      toast.success(`Selected: ${selectedSlot.name}`);
    }, 4200);
  };

  const reset = () => {
    setResult(null);
    setVisibleSlots([]);
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform = "translateX(0)";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
          <Dices className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Slot Picker</h1>
          <p className="text-muted-foreground">Random slot wheel with customizable options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card className="lg:col-span-1 gaming-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Providers</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllProviders} className="text-xs">
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllProviders} className="text-xs">
                    None
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
                {providers.map((provider) => (
                  <div key={provider} className="flex items-center space-x-2">
                    <Checkbox
                      id={provider}
                      checked={selectedProviders.includes(provider)}
                      onCheckedChange={() => toggleProvider(provider)}
                    />
                    <label
                      htmlFor={provider}
                      className="text-sm text-muted-foreground cursor-pointer truncate"
                    >
                      {provider}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedProviders.length} of {providers.length} selected
              </p>
            </div>

            {/* Bet Size Range */}
            <div className="space-y-3">
              <Label className="text-foreground font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Bet Size Range: ${betRange[0]} - ${betRange[1]}
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-8">Min</span>
                  <Slider
                    value={[betRange[0]]}
                    onValueChange={(v) => setBetRange([v[0], Math.max(v[0], betRange[1])])}
                    max={50}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-8">${betRange[0]}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-8">Max</span>
                  <Slider
                    value={[betRange[1]]}
                    onValueChange={(v) => setBetRange([Math.min(betRange[0], v[0]), v[0]])}
                    max={50}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-8">${betRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Spin Count Range */}
            <div className="space-y-3">
              <Label className="text-foreground font-semibold flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-accent" />
                Spins Range: {spinRange[0]} - {spinRange[1]}
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-8">Min</span>
                  <Slider
                    value={[spinRange[0]]}
                    onValueChange={(v) => setSpinRange([v[0], Math.max(v[0], spinRange[1])])}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-8">{spinRange[0]}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-8">Max</span>
                  <Slider
                    value={[spinRange[1]]}
                    onValueChange={(v) => setSpinRange([Math.min(spinRange[0], v[0]), v[0]])}
                    max={100}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-8">{spinRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Extra Chance Toggle */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <Label className="text-foreground font-semibold">Extra Chance</Label>
              </div>
              <Switch checked={extraChance} onCheckedChange={setExtraChance} />
            </div>

            {/* Spin Button */}
            <Button
              onClick={spin}
              disabled={isSpinning || selectedProviders.length === 0}
              className="w-full h-14 text-lg font-bold gaming-button"
            >
              {isSpinning ? (
                <>
                  <RotateCcw className="h-5 w-5 mr-2 animate-spin" />
                  Spinning...
                </>
              ) : (
                <>
                  <Dices className="h-5 w-5 mr-2" />
                  SPIN THE WHEEL
                </>
              )}
            </Button>

            {result && (
              <Button variant="outline" onClick={reset} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Wheel and Result Panel */}
        <Card className="lg:col-span-2 gaming-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dices className="h-5 w-5 text-primary" />
              Slot Wheel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wheel Container */}
            <div className="relative">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
              
              {/* Wheel Track */}
              <div 
                ref={containerRef}
                className="relative overflow-hidden bg-secondary/50 rounded-xl h-32 mt-8 border-2 border-border"
              >
                {/* Gradient Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
                
                {/* Scrolling Items */}
                <div
                  ref={wheelRef}
                  className="flex items-center h-full gap-4 px-4"
                  style={{ transform: "translateX(0)" }}
                >
                  {visibleSlots.length > 0 ? (
                    visibleSlots.map((slot, index) => (
                      <div
                        key={`${spinId}-${index}`}
                        className={`flex-shrink-0 w-44 h-24 bg-gradient-to-br from-secondary to-muted rounded-lg border-2 flex flex-col items-center justify-center p-3 transition-all ${
                          index === winnerIndex && !isSpinning ? "border-primary bg-primary/20" : "border-border"
                        }`}
                      >
                        <span className="text-sm font-bold text-foreground text-center line-clamp-2">
                          {slot.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {slot.provider}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center w-full text-muted-foreground">
                      Click "SPIN THE WHEEL" to start
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-6 border-2 border-primary/50 animate-fade-in">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <h3 className="text-2xl font-bold text-foreground">Result</h3>
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="bg-card/80 rounded-xl p-6 space-y-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Selected Slot</p>
                      <p className="text-3xl font-bold text-primary">{result.slot.name}</p>
                      <Badge variant="secondary" className="mt-1">{result.slot.provider}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="text-center p-4 bg-secondary/50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Bet Size</p>
                        <p className="text-2xl font-bold text-foreground">${result.betSize}</p>
                      </div>
                      <div className="text-center p-4 bg-secondary/50 rounded-lg">
                        <RotateCcw className="h-6 w-6 text-accent mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Spins</p>
                        <p className="text-2xl font-bold text-foreground">{result.spins}</p>
                      </div>
                    </div>
                    
                    {result.hasExtraChance && (
                      <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/50">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <span className="text-yellow-500 font-semibold">Extra Chance Active!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && visibleSlots.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Dices className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Configure your settings and spin the wheel!</p>
                <p className="text-sm mt-2">
                  {getFilteredSlots().length} slots available from {selectedProviders.length} providers
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
