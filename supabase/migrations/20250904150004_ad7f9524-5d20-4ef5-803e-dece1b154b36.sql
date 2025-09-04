-- Create slots events table
CREATE TABLE public.slots_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  max_calls_per_user integer NOT NULL DEFAULT 1,
  bet_size decimal(10,2) NOT NULL,
  prize text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  channel_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Create slots calls/submissions table
CREATE TABLE public.slots_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.slots_events(id) ON DELETE CASCADE,
  viewer_username text NOT NULL,
  viewer_kick_id text,
  slot_name text NOT NULL,
  bet_amount decimal(10,2) NOT NULL,
  win_amount decimal(10,2),
  multiplier decimal(10,4),
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  call_order integer NOT NULL
);

-- Enable RLS
ALTER TABLE public.slots_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots_calls ENABLE ROW LEVEL SECURITY;

-- RLS policies for slots_events
CREATE POLICY "Users can view their own slots events" 
ON public.slots_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own slots events" 
ON public.slots_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own slots events" 
ON public.slots_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own slots events" 
ON public.slots_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for slots_calls
CREATE POLICY "Event owners can view calls for their events" 
ON public.slots_calls 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.slots_events 
  WHERE slots_events.id = slots_calls.event_id 
  AND slots_events.user_id = auth.uid()
));

CREATE POLICY "Insert calls for active events" 
ON public.slots_calls 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.slots_events 
  WHERE slots_events.id = slots_calls.event_id 
  AND slots_events.status = 'active'
));

CREATE POLICY "Event owners can update calls for their events" 
ON public.slots_calls 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.slots_events 
  WHERE slots_events.id = slots_calls.event_id 
  AND slots_events.user_id = auth.uid()
));

CREATE POLICY "Event owners can delete calls for their events" 
ON public.slots_calls 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.slots_events 
  WHERE slots_events.id = slots_calls.event_id 
  AND slots_events.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_slots_events_user_id ON public.slots_events(user_id);
CREATE INDEX idx_slots_events_status ON public.slots_events(status);
CREATE INDEX idx_slots_calls_event_id ON public.slots_calls(event_id);
CREATE INDEX idx_slots_calls_viewer_username ON public.slots_calls(viewer_username);
CREATE INDEX idx_slots_calls_status ON public.slots_calls(status);

-- Create trigger for updated_at
CREATE TRIGGER update_slots_events_updated_at
BEFORE UPDATE ON public.slots_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get next call order for an event
CREATE OR REPLACE FUNCTION public.get_next_call_order(event_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(call_order), 0) + 1 
  FROM public.slots_calls 
  WHERE event_id = event_uuid;
$$;