import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Global connections map to track active monitors
const activeMonitors = new Map<string, {
  socket: WebSocket;
  userId: string;
  kickUsername: string;
  channelId: string;
  lastHeartbeat: Date;
}>();

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    console.log(`🤖 Auto Monitor Action: ${action}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'start_monitoring':
        return await startUserMonitoring(body.user_id, body.token_info, supabase);
      
      case 'stop_monitoring':
        return await stopUserMonitoring(body.user_id, supabase);
      
      case 'get_status':
        return await getMonitoringStatus(body.user_id, supabase);
        
      case 'heartbeat':
        return await updateHeartbeat(body.user_id, supabase);
        
      case 'send_message':
        return await sendUserMessage(body.message, body.token, supabase);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error("❌ Error in auto monitor:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function startUserMonitoring(userId: string, tokenInfo: any, supabase: any): Promise<Response> {
  try {
    console.log(`🔧 Starting monitoring for user: ${userId}`);

    // Get user's Kick data from the request (passed from frontend)
    if (!tokenInfo?.access_token) {
      throw new Error("No bot token provided");
    }

    // Get Kick user info from the token
    console.log(`🔍 Getting Kick user info from token...`);
    const userResponse = await fetch('https://api.kick.com/public/v1/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenInfo.access_token}`,
        'Accept': 'application/json',
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to get Kick user info: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const kickUserData = userData.data?.[0];
    
    if (!kickUserData) {
      throw new Error("No Kick user data found in token response");
    }

    console.log(`✅ Got Kick user data: ${kickUserData.name} (ID: ${kickUserData.user_id})`);

    // Update/create profile with Kick data
    await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        kick_username: kickUserData.name,
        kick_user_id: kickUserData.user_id?.toString(),
        kick_channel_id: kickUserData.user_id?.toString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      });

    console.log(`✅ Updated profile with Kick data for user: ${kickUserData.name}`);

    // Create or update monitor record
    const { data: monitor, error: monitorError } = await supabase
      .from('chatbot_monitors')
      .upsert({
        user_id: userId,
        kick_user_id: kickUserData.user_id?.toString(),
        kick_username: kickUserData.name,
        channel_id: kickUserData.user_id?.toString(),
        is_active: true,
        last_heartbeat: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      })
      .select()
      .single();

    if (monitorError) {
      throw new Error(`Failed to create monitor record: ${monitorError.message}`);
    }

    // Start background monitoring task
    EdgeRuntime.waitUntil(runChatMonitor(userId, kickUserData.name, kickUserData.user_id?.toString(), tokenInfo, supabase));

    console.log(`✅ Monitoring started for @${kickUserData.name}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Monitoring started for @${kickUserData.name}`,
        monitor_id: monitor.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error(`❌ Failed to start monitoring:`, error);
    throw error;
  }
}

async function runChatMonitor(userId: string, kickUsername: string, channelId: string, tokenInfo: any, supabase: any) {
  console.log(`🤖 Starting background chat monitor for @${kickUsername}`);
  
  try {
    // Get channel info to find chatroom ID
    const channelResponse = await fetch(`https://kick.com/api/v2/channels/${kickUsername}`);
    
    if (!channelResponse.ok) {
      throw new Error(`Channel not found: ${kickUsername}`);
    }

    const channelData = await channelResponse.json();
    const chatroomId = channelData.chatroom?.id;

    if (!chatroomId) {
      throw new Error(`No chatroom found for channel: ${kickUsername}`);
    }

    console.log(`📡 Connecting to chatroom ${chatroomId} for @${kickUsername}`);

    // Connect to Kick's Pusher WebSocket
    const pusherUrl = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";
    const kickSocket = new WebSocket(pusherUrl);

    // Store active monitor
    activeMonitors.set(userId, {
      socket: kickSocket,
      userId,
      kickUsername,
      channelId,
      lastHeartbeat: new Date()
    });

    kickSocket.onopen = () => {
      console.log(`✅ Connected to Kick WebSocket for @${kickUsername}`);
      
      // Subscribe to the chatroom channel
      const subscribeMessage = {
        event: "pusher:subscribe",
        data: {
          channel: `chatrooms.${chatroomId}.v2`
        }
      };
      
      kickSocket.send(JSON.stringify(subscribeMessage));
    };

    kickSocket.onmessage = async (event) => {
      try {
        const pusherData = JSON.parse(event.data);

        // Handle chat messages
        if (pusherData.event === 'App\\Events\\ChatMessageEvent') {
          const messageData = JSON.parse(pusherData.data);
          
          // Update message count
          await supabase
            .from('chatbot_monitors')
            .update({ 
              total_messages_processed: supabase.raw('total_messages_processed + 1'),
              last_heartbeat: new Date().toISOString()
            })
            .eq('user_id', userId);

          // Check if message is a command
          if (messageData.content?.startsWith('!')) {
            const command = messageData.content.substring(1).split(' ')[0].toLowerCase();
            console.log(`🎯 Auto-processing command: !${command} from @${messageData.sender?.username}`);

            await processCommandBackground(command, messageData, userId, tokenInfo, supabase);
          }
        }
      } catch (error) {
        console.error("❌ Error processing chat message:", error);
      }
    };

    kickSocket.onerror = async (error) => {
      console.error(`❌ WebSocket error for @${kickUsername}:`, error);
      
      // Mark monitor as inactive
      await supabase
        .from('chatbot_monitors')
        .update({ is_active: false })
        .eq('user_id', userId);

      activeMonitors.delete(userId);
    };

    kickSocket.onclose = async () => {
      console.log(`🔌 WebSocket disconnected for @${kickUsername}`);
      
      // Mark monitor as inactive
      await supabase
        .from('chatbot_monitors')
        .update({ is_active: false })
        .eq('user_id', userId);

      activeMonitors.delete(userId);
    };

  } catch (error) {
    console.error(`❌ Error in chat monitor for @${kickUsername}:`, error);
    
    // Mark monitor as inactive
    await supabase
      .from('chatbot_monitors')
      .update({ is_active: false })
      .eq('user_id', userId);
  }
}

async function processCommandBackground(command: string, messageData: any, userId: string, tokenInfo: any, supabase: any) {
  try {
    // Look up command in database
    const { data: commands, error } = await supabase
      .from('commands')
      .select('*')
      .eq('command', command)
      .eq('user_id', userId)
      .eq('enabled', true)
      .single();

    if (error || !commands) {
      console.log(`❌ Command not found: !${command}`);
      return;
    }

    // Check user permissions
    const userLevel = getUserLevel(messageData.sender);
    const hasPermission = checkUserPermission(userLevel, commands.user_level);
    
    if (!hasPermission) {
      console.log(`🚫 Permission denied for !${command}`);
      return;
    }

    // Send bot response
    await sendBotMessage(commands.response, tokenInfo.access_token);
    
    // Update usage stats
    await supabase
      .from('commands')
      .update({ uses: commands.uses + 1 })
      .eq('id', commands.id);

    await supabase
      .from('chatbot_monitors')
      .update({ 
        total_commands_processed: supabase.raw('total_commands_processed + 1'),
        last_heartbeat: new Date().toISOString()
      })
      .eq('user_id', userId);

    console.log(`✅ Auto-processed command !${command}`);

  } catch (error) {
    console.error(`❌ Error processing command !${command}:`, error);
  }
}

async function sendBotMessage(message: string, token: string) {
  try {
    const response = await fetch('https://api.kick.com/public/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        type: 'bot',
        content: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kick API error: ${response.status} - ${errorText}`);
    }

    console.log(`✅ Auto-sent message: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error(`❌ Failed to send auto message:`, error);
  }
}

function getUserLevel(sender: any): string {
  if (sender?.identity?.badges?.some((badge: any) => badge.type === 'broadcaster')) {
    return 'owner';
  }
  if (sender?.identity?.badges?.some((badge: any) => badge.type === 'moderator')) {
    return 'moderator';
  }
  if (sender?.identity?.badges?.some((badge: any) => badge.type === 'subscriber')) {
    return 'subscriber';
  }
  return 'viewer';
}

function checkUserPermission(userLevel: string, requiredLevel: string): boolean {
  const levels = {
    'viewer': 0,
    'everyone': 0,  // everyone = viewer level
    'subscriber': 1,
    'moderator': 2,
    'owner': 3
  };

  const userLevelNum = levels[userLevel as keyof typeof levels] || 0;
  const requiredLevelNum = levels[requiredLevel as keyof typeof levels] || 0;

  return userLevelNum >= requiredLevelNum;
}

async function stopUserMonitoring(userId: string, supabase: any): Promise<Response> {
  try {
    // Close WebSocket connection
    const monitor = activeMonitors.get(userId);
    if (monitor) {
      monitor.socket.close();
      activeMonitors.delete(userId);
    }

    // Update database
    await supabase
      .from('chatbot_monitors')
      .update({ is_active: false })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Monitoring stopped"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    throw error;
  }
}

async function getMonitoringStatus(userId: string, supabase: any): Promise<Response> {
  try {
    const { data: monitor, error } = await supabase
      .from('chatbot_monitors')
      .select('*')
      .eq('user_id', userId)
      .single();

    const isActiveInMemory = activeMonitors.has(userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        monitor: monitor || null,
        is_connected: isActiveInMemory,
        active_monitors_count: activeMonitors.size
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    throw error;
  }
}

async function updateHeartbeat(userId: string, supabase: any): Promise<Response> {
  try {
    const monitor = activeMonitors.get(userId);
    if (monitor) {
      monitor.lastHeartbeat = new Date();
    }

    await supabase
      .from('chatbot_monitors')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    throw error;
  }
}

async function sendUserMessage(message: string, token: string, supabase: any): Promise<Response> {
  try {
    console.log(`🤖 Sending bot message: ${message.substring(0, 50)}...`);
    
    // Send message as the bot using the bot token
    const response = await fetch('https://kick.com/api/v2/messages/send/1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Socket-ID': 'bot-socket-id'
      },
      body: JSON.stringify({
        chatroom_id: 1, // This will be dynamic based on the channel
        content: message,
        type: 'message'
      })
    });

    if (!response.ok) {
      // Try alternative API endpoint
      const altResponse = await fetch('https://kick.com/api/v1/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          type: 'message'
        })
      });
      
      if (!altResponse.ok) {
        const errorText = await altResponse.text();
        throw new Error(`Kick Bot API error: ${altResponse.status} - ${errorText}`);
      }
    }

    console.log(`✅ Bot message sent successfully: ${message.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Bot message sent successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error(`❌ Failed to send bot message:`, error);
    throw error;
  }
}

// Cleanup inactive monitors every 5 minutes
setInterval(async () => {
  const now = new Date();
  for (const [userId, monitor] of activeMonitors.entries()) {
    const timeSinceHeartbeat = now.getTime() - monitor.lastHeartbeat.getTime();
    if (timeSinceHeartbeat > 300000) { // 5 minutes
      console.log(`🧹 Cleaning up inactive monitor for user: ${userId}`);
      monitor.socket.close();
      activeMonitors.delete(userId);
    }
  }
}, 300000); // 5 minutes

serve(handler);