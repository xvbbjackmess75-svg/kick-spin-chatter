import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useKickAccount } from '@/hooks/useKickAccount';
import { useAuth } from '@/hooks/useAuth';

interface PostHistory {
  id: string;
  channel: string;
  message: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

const KickChatPoster = () => {
  const [message, setMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postHistory, setPostHistory] = useState<PostHistory[]>([]);
  const [userChannel, setUserChannel] = useState<string>('');
  const { kickUser } = useKickAccount();
  const { user } = useAuth();

  useEffect(() => {
    // Get the user's linked Kick channel
    if (user) {
      loadUserChannel();
    }
  }, [user]);

  const loadUserChannel = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('kick_username')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (profile?.kick_username) {
        setUserChannel(profile.kick_username);
      }
    } catch (error) {
      console.error('Error loading user channel:', error);
    }
  };

  const handlePostMessage = async () => {
    if (!userChannel || !message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to post messages');
      return;
    }

    setIsPosting(true);

    try {
      console.log('🚀 Posting message to your Kick channel...');
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const { data, error } = await supabase.functions.invoke('kick-chat-post', {
        body: {
          message: message.trim(),
          authToken: session.access_token
        }
      });

      console.log('📤 Function response:', { data, error });

      if (error) {
        throw error;
      }

      const newPost: PostHistory = {
        id: Date.now().toString(),
        channel: userChannel,
        message: message.trim(),
        timestamp: new Date(),
        success: true
      };

      setPostHistory(prev => [newPost, ...prev.slice(0, 9)]); // Keep last 10 posts
      toast.success(`Message posted successfully to your channel!`);
      
      // Clear the message
      setMessage('');

    } catch (error: any) {
      console.error('❌ Post failed:', error);
      
      let errorMessage = error.message || 'Unknown error';
      
      // Check for specific admin setup error
      if (errorMessage.includes('Admin Kick account not linked')) {
        errorMessage = 'Admin needs to link their Kick account first. Contact administrator.';
        toast.error('Setup Required: The admin account must link their Kick account via OAuth before chat posting can work.');
      } else {
        toast.error(`Failed to post message: ${errorMessage}`);
      }
      
      const newPost: PostHistory = {
        id: Date.now().toString(),
        channel: userChannel || 'unknown',
        message: message.trim(),
        timestamp: new Date(),
        success: false,
        error: errorMessage
      };

      setPostHistory(prev => [newPost, ...prev.slice(0, 9)]);
    } finally {
      setIsPosting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Kick Chat Poster
            {kickUser?.authenticated && (
              <span className="text-sm text-muted-foreground">
                as @{kickUser.username}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userChannel && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ You need to link your Kick account first to post messages.
              </p>
            </div>
          )}
          
          {userChannel && (
            <div className="space-y-2">
              <Label>Your Kick Channel</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="font-medium">#{userChannel}</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Messages will be posted to your linked channel using the admin's account.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPosting || !userChannel}
              rows={3}
            />
          </div>

          <Button 
            onClick={handlePostMessage} 
            disabled={isPosting || !userChannel || !message.trim()}
            className="w-full"
          >
            {isPosting ? 'Posting...' : 'Post Message'}
          </Button>
        </CardContent>
      </Card>

      {postHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📜 Post History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {postHistory.map((post) => (
                <div 
                  key={post.id}
                  className={`p-3 rounded-lg border ${
                    post.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">#{post.channel}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(post.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{post.message}</p>
                  {!post.success && post.error && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {post.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KickChatPoster;
