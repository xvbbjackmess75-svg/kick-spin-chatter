-- Create storage bucket for support images
INSERT INTO storage.buckets (id, name, public) VALUES ('support-images', 'support-images', true);

-- Create policies for support image uploads
CREATE POLICY "Users can upload support images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'support-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view support images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'support-images');

CREATE POLICY "Admins can delete support images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'support-images' AND EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Add image_url column to support_messages table
ALTER TABLE support_messages ADD COLUMN image_url text;