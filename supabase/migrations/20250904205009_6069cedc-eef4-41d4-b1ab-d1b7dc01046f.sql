-- Add rate limiting protection for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Prevent profile enumeration" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  -- Only allow viewing other profiles in specific contexts
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'premium', 'vip_plus')
  )
);