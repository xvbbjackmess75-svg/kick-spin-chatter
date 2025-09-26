import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Search, Database, Check, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Slot {
  id: string;
  name: string;
  provider: string;
  theme?: string;
  rtp?: number;
  max_multiplier?: number;
  is_user_added: boolean;
  added_by_user_id?: string;
}

export const SlotManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({
    name: '',
    provider: '',
    theme: '',
    rtp: '',
    max_multiplier: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch slots with search
  const { data: slots, isLoading } = useQuery({
    queryKey: ['admin-slots', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('slots')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,provider.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as Slot[];
    }
  });

  // Get total slot count
  const { data: totalCount } = useQuery({
    queryKey: ['slots-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const providers = [
    'Pragmatic Play', 'NetEnt', 'Play\'n GO', 'Microgaming', 'Evolution',
    'Red Tiger', 'Push Gaming', 'Big Time Gaming', 'Blueprint Gaming',
    'Yggdrasil', 'Quickspin', 'Nolimit City', 'Relax Gaming', 'Hacksaw Gaming',
    'Print Studios', 'Elk Studios', 'Thunderkick', 'IGT', 'WMS', 'Bally',
    'Scientific Games', 'Aristocrat', 'Novomatic', 'Merkur', 'Gamomat'
  ];

  const themes = [
    'Egyptian', 'Adventure', 'Mythology', 'Animals', 'Fantasy', 'Fruit',
    'Classic', 'Ocean', 'Space', 'Music', 'Horror', 'Western', 'Asian',
    'Candy', 'Pirates', 'Mexican', 'Mining', 'Fire', 'Ice', 'Money'
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSlots(slots?.map(slot => slot.id) || []);
    } else {
      setSelectedSlots([]);
    }
  };

  const handleSelectSlot = (slotId: string, checked: boolean) => {
    if (checked) {
      setSelectedSlots(prev => [...prev, slotId]);
    } else {
      setSelectedSlots(prev => prev.filter(id => id !== slotId));
    }
  };

  const deleteAllSlots = async () => {
    try {
      let deletedCount = 0;
      let hasMore = true;
      
      while (hasMore) {
        // Get a smaller batch of slot IDs (limit to 100 to avoid URL length issues)
        const { data: batchSlots, error: fetchError } = await supabase
          .from('slots')
          .select('id')
          .limit(100);
        
        if (fetchError) throw fetchError;
        
        if (!batchSlots || batchSlots.length === 0) {
          hasMore = false;
          break;
        }

        // Delete this batch
        const { error: deleteError } = await supabase
          .from('slots')
          .delete()
          .in('id', batchSlots.map(slot => slot.id));

        if (deleteError) throw deleteError;
        
        deletedCount += batchSlots.length;
        
        // If we got less than 100, we're done
        if (batchSlots.length < 100) {
          hasMore = false;
        }
      }

      toast({
        title: "All slots deleted",
        description: `Successfully deleted ${deletedCount} slots from the database.`
      });

      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['slots-count'] });
      setSelectedSlots([]);
    } catch (error) {
      console.error('Error deleting all slots:', error);
      toast({
        title: "Error",
        description: "Failed to delete all slots. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteSelectedSlots = async () => {
    if (selectedSlots.length === 0) return;

    try {
      const { error } = await supabase
        .from('slots')
        .delete()
        .in('id', selectedSlots);

      if (error) throw error;

      toast({
        title: "Selected slots deleted",
        description: `${selectedSlots.length} slots have been successfully removed.`
      });

      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['slots-count'] });
      setSelectedSlots([]);
    } catch (error) {
      console.error('Error deleting selected slots:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected slots. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addCustomSlot = async () => {
    if (!newSlot.name || !newSlot.provider) {
      toast({
        title: "Error",
        description: "Name and provider are required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('slots')
        .insert({
          name: newSlot.name,
          provider: newSlot.provider,
          theme: newSlot.theme || null,
          rtp: newSlot.rtp ? parseFloat(newSlot.rtp) : null,
          max_multiplier: newSlot.max_multiplier ? parseInt(newSlot.max_multiplier) : null,
          is_user_added: true
        });

      if (error) throw error;

      toast({
        title: "Slot added",
        description: "Custom slot has been successfully added."
      });

      queryClient.invalidateQueries({ queryKey: ['admin-slots'] });
      queryClient.invalidateQueries({ queryKey: ['slots-count'] });
      setShowAddDialog(false);
      setNewSlot({ name: '', provider: '', theme: '', rtp: '', max_multiplier: '' });
    } catch (error) {
      console.error('Error adding custom slot:', error);
      toast({
        title: "Error",
        description: "Failed to add custom slot. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading slots...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalCount || 0}</div>
            <div className="text-sm text-muted-foreground">Total Slots</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{selectedSlots.length}</div>
            <div className="text-sm text-muted-foreground">Selected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{slots?.filter(s => s.is_user_added).length || 0}</div>
            <div className="text-sm text-muted-foreground">Custom Slots</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Slot Management
            </span>
            <div className="flex items-center gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Custom Slot</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="slot-name">Slot Name *</Label>
                      <Input
                        id="slot-name"
                        value={newSlot.name}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter slot name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slot-provider">Provider *</Label>
                      <Select value={newSlot.provider} onValueChange={(value) => setNewSlot(prev => ({ ...prev, provider: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map(provider => (
                            <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="slot-theme">Theme</Label>
                      <Select value={newSlot.theme} onValueChange={(value) => setNewSlot(prev => ({ ...prev, theme: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {themes.map(theme => (
                            <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="slot-rtp">RTP %</Label>
                        <Input
                          id="slot-rtp"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={newSlot.rtp}
                          onChange={(e) => setNewSlot(prev => ({ ...prev, rtp: e.target.value }))}
                          placeholder="96.50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slot-multiplier">Max Multiplier</Label>
                        <Input
                          id="slot-multiplier"
                          type="number"
                          min="1"
                          value={newSlot.max_multiplier}
                          onChange={(e) => setNewSlot(prev => ({ ...prev, max_multiplier: e.target.value }))}
                          placeholder="5000"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addCustomSlot}>
                        Add Slot
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Actions */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search slots by name or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={selectedSlots.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedSlots.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Slots</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedSlots.length} selected slots? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteSelectedSlots} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Selected
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Slots</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete ALL slots from the database? This will remove all {totalCount} slots and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllSlots} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete All Slots
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-2 py-2 border-b">
            <Checkbox
              checked={slots?.length > 0 && selectedSlots.length === slots.length}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-sm font-medium">
              Select All ({slots?.length || 0} slots)
            </Label>
          </div>

          {/* Slots List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {slots?.map((slot) => (
              <div key={slot.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                <Checkbox
                  checked={selectedSlots.includes(slot.id)}
                  onCheckedChange={(checked) => handleSelectSlot(slot.id, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{slot.name}</h4>
                    {slot.is_user_added && (
                      <Badge variant="secondary" className="text-xs">Custom</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{slot.provider}</span>
                    {slot.theme && <span>• {slot.theme}</span>}
                    {slot.rtp && <span>• RTP: {slot.rtp}%</span>}
                    {slot.max_multiplier && <span>• Max: {slot.max_multiplier}x</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!slots || slots.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No slots found matching your search.' : 'No slots available.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};