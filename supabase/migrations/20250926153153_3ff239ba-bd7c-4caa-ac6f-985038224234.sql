-- Add RLS policy to allow admins to delete slots
CREATE POLICY "Admins can delete slots" 
ON public.slots 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);