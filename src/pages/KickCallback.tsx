import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function KickCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleKickCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast({
          title: "Authentication Failed",
          description: error,
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      if (!code) {
        toast({
          title: "Invalid Authentication",
          description: "No authorization code received",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      try {
        // In the future, when Kick API is public, this would:
        // 1. Exchange the code for an access token
        // 2. Fetch user data from Kick
        // 3. Create or sign in the user with Supabase
        
        // For now, we'll simulate success
        toast({
          title: "Kick Integration",
          description: "Kick OAuth will be fully supported when their API is public",
          variant: "default"
        });
        
        navigate('/auth');
      } catch (err) {
        toast({
          title: "Authentication Error", 
          description: "Failed to complete Kick authentication",
          variant: "destructive"
        });
        navigate('/auth');
      }
    };

    handleKickCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kick-green mx-auto" />
        <p className="text-muted-foreground">Connecting with Kick...</p>
      </div>
    </div>
  );
}