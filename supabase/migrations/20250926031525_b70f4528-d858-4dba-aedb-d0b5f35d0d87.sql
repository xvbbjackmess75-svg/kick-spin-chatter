-- Create test overlay layouts table
CREATE TABLE public.test_overlay_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('slots', 'bonus_hunt')),
  layout_config jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create test overlay templates table  
CREATE TABLE public.test_overlay_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('slots', 'bonus_hunt')),
  template_config jsonb NOT NULL,
  created_by uuid NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_overlay_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_overlay_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_overlay_layouts
CREATE POLICY "Admins can manage all test overlay layouts"
ON public.test_overlay_layouts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for test_overlay_templates  
CREATE POLICY "Admins can manage all test overlay templates"
ON public.test_overlay_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_test_overlay_layouts_updated_at
  BEFORE UPDATE ON public.test_overlay_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_overlay_layouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_overlay_templates;