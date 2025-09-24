import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useKickAccount } from '@/hooks/useKickAccount';

interface PostHistory {
  id: string;
  channel: string;
  message: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

const KickChatPoster = () => {
  const [channelName, setChannelName] = useState('');
  const [message, setMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postHistory, setPostHistory] = useState<PostHistory[]>([]);
  const { kickUser } = useKickAccount();

  const handlePostMessage = async () => {
    if (!channelName.trim() || !message.trim()) {
      toast.error('Please enter both channel name and message');
      return;
    }

    if (!kickUser?.authenticated) {
      toast.error('You need to link your Kick account first');
      return;
    }

    setIsPosting(true);

    try {
      console.log('🚀 Posting message to Kick chat...');
      
      // Get the stored Kick access token from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      const kickAccessToken = user?.user_metadata?.kick_access_token;

      if (!kickAccessToken) {
        throw new Error('No Kick access token found. Please re-link your Kick account.');
      }

      console.log('🔑 Using access token:', kickAccessToken ? 'PRESENT' : 'MISSING');

      const { data, error } = await supabase.functions.invoke('kick-chat-post', {
        body: {
          channelName: channelName.trim(),
          message: message.trim(),
          kickAccessToken: kickAccessToken
        }
      });

      console.log('📤 Function response:', { data, error });

      if (error) {
        throw error;
      }

      const newPost: PostHistory = {
        id: Date.now().toString(),
        channel: channelName.trim(),
        message: message.trim(),
        timestamp: new Date(),
        success: true
      };

      setPostHistory(prev => [newPost, ...prev.slice(0, 9)]); // Keep last 10 posts
      toast.success(`Message posted successfully to ${channelName}!`);
      
      // Clear the message but keep the channel name for convenience
      setMessage('');

    } catch (error: any) {
      console.error('❌ Post failed:', error);
      
      const newPost: PostHistory = {
        id: Date.now().toString(),
        channel: channelName.trim(),
        message: message.trim(),
        timestamp: new Date(),
        success: false,
        error: error.message || 'Unknown error'
      };

      setPostHistory(prev => [newPost, ...prev.slice(0, 9)]);
      toast.error(`Failed to post message: ${error.message || 'Unknown error'}`);
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
          {!kickUser?.authenticated && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ You need to link your Kick account first to post messages.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="channel">Channel Name</Label>
            <Input
              id="channel"
              placeholder="Enter channel name (e.g., 'trainwreckstv')"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              disabled={isPosting || !kickUser?.authenticated}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPosting || !kickUser?.authenticated}
              rows={3}
            />
          </div>

          <Button 
            onClick={handlePostMessage} 
            disabled={isPosting || !kickUser?.authenticated || !channelName.trim() || !message.trim()}
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
