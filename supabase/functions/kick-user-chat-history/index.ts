import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KickChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: number;
    username: string;
    slug: string;
    identity?: {
      color?: string;
      badges?: Array<{ type: string; text: string }>;
    };
  };
  metadata?: any;
}

interface KickChatHistoryResponse {
  data: KickChatMessage[];
  links?: {
    next?: string;
    prev?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { username, channelName, limit = 50 } = await req.json();

    if (!username || !channelName) {
      throw new Error('Username and channel name are required');
    }

    console.log(`Fetching chat history for user: ${username} in channel: ${channelName}`);

    // Get the user's Kick account info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linked_kick_user_id, linked_kick_username')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.linked_kick_user_id) {
      throw new Error('User must have a linked Kick account');
    }

    // First, get the channel info to find the chatroom ID
    const channelResponse = await fetch(`https://kick.com/api/v1/channels/${channelName}`);
    
    if (!channelResponse.ok) {
      throw new Error(`Failed to fetch channel info: ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    const chatroomId = channelData.chatroom?.id;

    if (!chatroomId) {
      throw new Error('Could not find chatroom ID for channel');
    }

    console.log(`Found chatroom ID: ${chatroomId} for channel: ${channelName}`);

    // Get the Kick bot token for API access
    const kickToken = Deno.env.get('KICK_BOT_TOKEN');
    if (!kickToken) {
      throw new Error('Kick bot token not configured');
    }

    // Fetch chat history from Kick API
    // Note: This endpoint might require specific permissions or might not be publicly available
    // We'll try the messages endpoint with user filtering
    const chatHistoryUrl = `https://kick.com/api/v1/channels/${channelName}/messages?limit=${limit}`;
    
    console.log(`Fetching from: ${chatHistoryUrl}`);

    const chatResponse = await fetch(chatHistoryUrl, {
      headers: {
        'Authorization': `Bearer ${kickToken}`,
        'Accept': 'application/json',
        'User-Agent': 'KickHelper/1.0'
      }
    });

    let messages: KickChatMessage[] = [];

    if (chatResponse.ok) {
      const chatData: KickChatHistoryResponse = await chatResponse.json();
      
      // Filter messages by the specific user
      messages = chatData.data?.filter(msg => 
        msg.sender.username.toLowerCase() === username.toLowerCase()
      ) || [];
      
      console.log(`Found ${messages.length} messages for user ${username}`);
    } else {
      console.error(`Failed to fetch chat history: ${chatResponse.status} ${chatResponse.statusText}`);
      
      // Fallback: Try to get messages from our own database if we've been storing them
      const { data: storedMessages, error: dbError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('kick_username', username)
        .eq('channel_id', chatroomId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (!dbError && storedMessages) {
        messages = storedMessages.map(msg => ({
          id: msg.id,
          content: msg.message,
          created_at: msg.timestamp,
          sender: {
            id: parseInt(msg.kick_user_id) || 0,
            username: msg.kick_username,
            slug: msg.kick_username.toLowerCase(),
            identity: {
              badges: msg.user_type === 'moderator' ? [{ type: 'moderator', text: 'Moderator' }] : []
            }
          },
          metadata: {}
        }));
        
        console.log(`Using stored messages: ${messages.length} found`);
      }
    }

    // Transform messages to a consistent format
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      message: msg.content,
      timestamp: new Date(msg.created_at),
      username: msg.sender.username,
      userId: msg.sender.id.toString(),
      badges: msg.sender.identity?.badges || [],
      userType: msg.sender.identity?.badges?.some(b => b.type === 'moderator') ? 'moderator' :
               msg.sender.identity?.badges?.some(b => b.type === 'subscriber') ? 'subscriber' : 'viewer'
    }));

    // Get user statistics
    const totalMessages = formattedMessages.length;
    const firstMessage = formattedMessages[formattedMessages.length - 1];
    const lastMessage = formattedMessages[0];
    
    // Calculate activity metrics
    const messagesByHour = formattedMessages.reduce((acc, msg) => {
      const hour = msg.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostActiveHour = Object.entries(messagesByHour)
      .sort(([,a], [,b]) => b - a)[0];

    const response = {
      messages: formattedMessages,
      statistics: {
        totalMessages,
        firstMessageDate: firstMessage?.timestamp || null,
        lastMessageDate: lastMessage?.timestamp || null,
        mostActiveHour: mostActiveHour ? {
          hour: parseInt(mostActiveHour[0]),
          messageCount: mostActiveHour[1]
        } : null,
        averageMessagesPerDay: totalMessages > 0 && firstMessage ? 
          totalMessages / Math.max(1, Math.ceil((Date.now() - firstMessage.timestamp.getTime()) / (1000 * 60 * 60 * 24))) : 0
      },
      channelInfo: {
        name: channelName,
        chatroomId
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: [],
        statistics: {
          totalMessages: 0,
          firstMessageDate: null,
          lastMessageDate: null,
          mostActiveHour: null,
          averageMessagesPerDay: 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});