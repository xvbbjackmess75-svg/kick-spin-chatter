-- Enable realtime for slots_calls table to ensure live updates work
ALTER TABLE public.slots_calls REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.slots_calls;

-- Also enable for slots_events to ensure events list updates
ALTER TABLE public.slots_events REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.slots_events;