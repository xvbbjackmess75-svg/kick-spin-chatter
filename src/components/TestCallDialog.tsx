import { useState } from "react";
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
  const { toast } = useToast();

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
          <Button 
            onClick={addTestCall} 
            className="w-full gaming-button"
            disabled={!selectedEvent || selectedEvent.status !== 'active'}
          >
            Add Test Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}