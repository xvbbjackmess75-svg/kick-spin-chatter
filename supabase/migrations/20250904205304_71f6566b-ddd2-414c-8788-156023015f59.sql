-- Enable real-time for slots_calls table
ALTER TABLE public.slots_calls REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.slots_calls;