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
  const [isOpen, setIsOpen] = useState(false);
  const [testSlotName, setTestSlotName] = useState("");
  const [testUsername, setTestUsername] = useState("");
  const [bulkCount, setBulkCount] = useState(50);
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const executionRef = useRef(false); // Track execution state
  const { toast } = useToast();

  // Force re-render debug
  console.log("🔄 TestCallDialog rendered with protection mechanisms", { 
    isAddingBulk, 
    executionRef: executionRef.current,
    timestamp: Date.now() 
  });

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

  const addBulkTestCalls = useCallback(async () => {
    console.log("🎯 FUNCTION CALLED: addBulkTestCalls started", {
      isAddingBulk,
      executionRef: executionRef.current,
      selectedEvent: !!selectedEvent,
      bulkCount,
      timestamp: Date.now()
    });

    // ABSOLUTE PREVENTION: Multiple layers of protection
    if (isAddingBulk || executionRef.current) {
      console.log("🚫 EXECUTION BLOCKED: Already in progress", {
        isAddingBulk,
        executionRef: executionRef.current
      });
      return;
    }

    if (!selectedEvent || bulkCount < 1) {
      console.log("🚫 VALIDATION FAILED:", { selectedEvent: !!selectedEvent, bulkCount });
      toast({
        title: "Error",
        description: "Please enter a valid number of test calls",
        variant: "destructive"
      });
      return;
    }

    // IMMEDIATE LOCK - Set both flags instantly
    console.log("🔒 LOCKING EXECUTION");
    setIsAddingBulk(true);
    executionRef.current = true;
    
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚀 EXECUTION START: ${executionId} - Creating ${bulkCount} calls`);

    try {
      const slotNames = [
        "Sweet Bonanza", "Gates of Olympus", "Book of Dead", "Starburst", "Reactoonz",
        "Legacy of Dead", "Moon Princess", "Fruit Party", "Big Bass Bonanza", "Dog House"
      ];
      
      const usernames = [
        "TestUser", "GamerPro", "SlotFan", "LuckyPlayer", "BigWinner", 
        "SpinMaster", "BonusHunter", "JackpotKing", "WildCatcher", "MegaWins"
      ];

      // Create exactly the requested number of calls
      const calls = [];
      for (let i = 0; i < bulkCount; i++) {
        const randomSlot = slotNames[Math.floor(Math.random() * slotNames.length)];
        const randomUser = usernames[Math.floor(Math.random() * usernames.length)] + Math.floor(Math.random() * 1000);
        
        calls.push({
          event_id: selectedEvent.id,
          viewer_username: randomUser,
          viewer_kick_id: `${executionId}_${i}`,
          slot_name: randomSlot,
          bet_amount: selectedEvent.bet_size,
          status: 'pending'
        });
      }

      console.log(`📋 CREATED ARRAY: ${calls.length} calls for ${executionId}`);

      // Get starting call order
      const { data: orderData } = await supabase
        .rpc('get_next_call_order', { event_uuid: selectedEvent.id });
      
      const startOrder = orderData || 1;
      
      // Add call_order to each call
      calls.forEach((call, index) => {
        call.call_order = startOrder + index;
      });

      // Single database operation
      const { error, data } = await supabase
        .from('slots_calls')
        .insert(calls)
        .select();

      if (error) throw error;

      console.log(`✅ SUCCESS: ${data?.length || 0} calls inserted for ${executionId}`);

      toast({
        title: "✅ Test Calls Added", 
        description: `Successfully added ${data?.length || calls.length} test calls`,
      });

      setIsOpen(false);
      onCallAdded();

    } catch (error) {
      console.error(`❌ ERROR: ${executionId}`, error);
      toast({
        title: "Error",
        description: `Failed to add test calls: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      console.log(`🔓 UNLOCKING: ${executionId}`);
      setIsAddingBulk(false);
      executionRef.current = false;
    }
  }, [selectedEvent, bulkCount, isAddingBulk, toast, onCallAdded]);

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
               onClick={addBulkTestCalls} 
               className="w-full gaming-button"
               disabled={!selectedEvent || selectedEvent.status !== 'active' || isAddingBulk}
               onDoubleClick={(e) => e.preventDefault()} // Prevent double-click
               style={{ pointerEvents: isAddingBulk ? 'none' : 'auto' }} // Additional protection
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