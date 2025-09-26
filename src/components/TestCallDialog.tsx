import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestTube2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestCallDialogProps {
  selectedEvent: any;
  onCallAdded: () => void;
}

export function TestCallDialog({ selectedEvent, onCallAdded }: TestCallDialogProps) {
  console.log("🔥 COMPONENT RENDER: TestCallDialog loaded", Date.now());
  
  const [isOpen, setIsOpen] = useState(false);
  const [testSlotName, setTestSlotName] = useState("");
  const [testUsername, setTestUsername] = useState("");
  const [bulkCount, setBulkCount] = useState(50);
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const executionRef = useRef(false);
  const { toast } = useToast();

  console.log("🔥 STATE VALUES:", { bulkCount, isAddingBulk, executionRef: executionRef.current });

  const addTestCall = async () => {
    if (!selectedEvent || !testSlotName.trim() || !testUsername.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both username and slot name for test call",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get next call order
      const { data: orderData } = await supabase
        .rpc('get_next_call_order', { event_uuid: selectedEvent.id });

      // Add test call to database
      const { error } = await supabase
        .from('slots_calls')
        .insert({
          event_id: selectedEvent.id,
          viewer_username: testUsername.trim(),
          viewer_kick_id: 'test_' + Date.now(),
          slot_name: testSlotName.trim(),
          bet_amount: selectedEvent.bet_size,
          status: 'pending',
          call_order: orderData || 1
        });

      if (error) throw error;

      toast({
        title: "✅ Test Call Added",
        description: `${testUsername} → ${testSlotName} (Test)`,
      });

      // Clear form and refresh
      setTestSlotName("");
      setTestUsername("");
      setIsOpen(false);
      onCallAdded();

    } catch (error) {
      console.error("Error adding test call:", error);
      toast({
        title: "Error",
        description: "Failed to add test call",
        variant: "destructive"
      });
    }
  };

  // SIMPLE APPROACH: Create a non-useCallback function with absolute protection
  const addBulkTestCalls = async () => {
    const startTime = Date.now();
    console.log("🚀 BULK ADD STARTED:", { 
      startTime, 
      bulkCount, 
      isAddingBulk, 
      refFlag: executionRef.current,
      hasEvent: !!selectedEvent 
    });

    // IMMEDIATE PREVENTION: Check if already running
    if (isAddingBulk) {
      console.log("🚫 BLOCKED: isAddingBulk is true");
      return;
    }

    if (executionRef.current) {
      console.log("🚫 BLOCKED: executionRef is true");
      return;
    }

    if (!selectedEvent || bulkCount < 1) {
      console.log("🚫 BLOCKED: Invalid parameters", { selectedEvent: !!selectedEvent, bulkCount });
      return;
    }

    // LOCK IMMEDIATELY
    console.log("🔒 SETTING LOCKS");
    setIsAddingBulk(true);
    executionRef.current = true;

    const execId = `simple_${startTime}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`🎯 EXECUTION ID: ${execId}`);

    try {
      const slots = ["Sweet Bonanza", "Gates of Olympus", "Book of Dead", "Starburst", "Dog House"];
      const names = ["TestUser", "GamerPro", "SlotFan", "LuckyPlayer", "BigWinner"];

      console.log(`📝 CREATING ${bulkCount} CALLS for ${execId}`);
      
      const calls = [];
      for (let i = 0; i < bulkCount; i++) {
        calls.push({
          event_id: selectedEvent.id,
          viewer_username: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000),
          viewer_kick_id: `${execId}_${i}`,
          slot_name: slots[Math.floor(Math.random() * slots.length)],
          bet_amount: selectedEvent.bet_size,
          status: 'pending',
          call_order: 1 + i
        });
      }

      console.log(`💾 INSERTING ${calls.length} calls to database for ${execId}`);

      const { error, data } = await supabase
        .from('slots_calls')
        .insert(calls)
        .select();

      if (error) throw error;

      console.log(`✅ SUCCESS: ${data?.length} calls inserted for ${execId}`);

      toast({
        title: "✅ Test Calls Added",
        description: `Added ${data?.length || calls.length} test calls (${execId})`,
      });

      setIsOpen(false);
      // Don't call onCallAdded() for bulk inserts - real-time listener handles it

    } catch (error) {
      console.error(`❌ ERROR ${execId}:`, error);
      toast({
        title: "Error",
        description: `Failed: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      console.log(`🔓 UNLOCKING ${execId}`);
      setIsAddingBulk(false);
      executionRef.current = false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gaming-button">
          <TestTube2 className="h-4 w-4 mr-2" />
          Add Test Call
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Test Participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="testUsername">Test Username</Label>
            <Input
              id="testUsername"
              value={testUsername}
              onChange={(e) => setTestUsername(e.target.value)}
              placeholder="e.g., TestViewer123"
            />
          </div>
          <div>
            <Label htmlFor="testSlotName">Slot Name</Label>
            <Input
              id="testSlotName"
              value={testSlotName}
              onChange={(e) => setTestSlotName(e.target.value)}
              placeholder="e.g., Sweet Bonanza"
            />
          </div>
          <div className="p-3 bg-secondary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This will add a test call to see how the overlay looks. Perfect for testing OBS setup!
            </p>
          </div>
          
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label htmlFor="bulkCount">Bulk Add Test Calls</Label>
              <Input
                id="bulkCount"
                type="number"
                value={bulkCount}
                onChange={(e) => setBulkCount(Number(e.target.value))}
                placeholder="50"
                min="1"
                max="200"
              />
             </div>
              <Button 
                onClick={() => {
                  console.log("🔥 BUTTON CLICKED: About to call addBulkTestCalls", Date.now());
                  addBulkTestCalls();
                }} 
                className="w-full gaming-button"
                disabled={!selectedEvent || selectedEvent.status !== 'active' || isAddingBulk}
                onDoubleClick={(e) => {
                  console.log("🚫 DOUBLE CLICK PREVENTED");
                  e.preventDefault();
                }}
                style={{ pointerEvents: isAddingBulk ? 'none' : 'auto' }}
              >
               {isAddingBulk ? (
                 <>
                   <div className="animate-spin mr-2">⏳</div>
                   Adding {bulkCount} calls...
                 </>
               ) : (
                 `Add ${bulkCount} Random Test Calls`
               )}
             </Button>
             <div className="text-xs text-muted-foreground text-center">
               ⚠️ Click once and wait - don't double-click to prevent duplicates
             </div>
          </div>

          <Button 
            onClick={addTestCall} 
            className="w-full gaming-button"
            disabled={!selectedEvent || selectedEvent.status !== 'active'}
          >
            Add Single Test Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}