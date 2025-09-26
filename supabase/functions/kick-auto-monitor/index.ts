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

    console.log(`🤖 Auto Monitor Action: ${action}`, { action, user_id: body.user_id, has_token: !!body.token });

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
        console.log(`🤖 Processing send_message for user: ${body.user_id} with token: ${body.token ? 'present' : 'missing'}`);
        console.log(`🤖 Message to send: "${body.message}"`);
        return await sendUserMessage(body.message, body.token, body.user_id, supabase);
      
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

    // Get user's profile to check for linked Kick account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kick_username, linked_kick_username, kick_user_id, linked_kick_user_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error("No profile found for user");
    }

    // Use linked kick account if available, otherwise fall back to kick_username
    const kickUsername = profile.linked_kick_username || profile.kick_username;
    const kickUserId = profile.linked_kick_user_id || profile.kick_user_id;

    if (!kickUsername) {
      throw new Error("No Kick account linked to profile");
    }

    console.log(`✅ Using Kick account: ${kickUsername} (ID: ${kickUserId})`);

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

    // Update profile with chatroom ID if not present
    await supabase
      .from('profiles')
      .update({
        kick_channel_id: chatroomId.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    console.log(`✅ Updated profile with chatroom ID: ${chatroomId}`);

    // Create or update monitor record
    const { data: monitor, error: monitorError } = await supabase
      .from('chatbot_monitors')
      .upsert({
        user_id: userId,
        kick_user_id: kickUserId?.toString(),
        kick_username: kickUsername,
        channel_id: kickUserId?.toString(),
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

    // Use bot token for monitoring (since user doesn't have Kick token)
    const botToken = Deno.env.get('KICK_BOT_TOKEN');
    const monitoringTokenInfo = { access_token: botToken };

    console.log(`🚀 Starting chat monitor with bot token for @${kickUsername}`);

    // Check if monitor is already active to prevent duplicates
    if (activeMonitors.has(userId)) {
      console.log(`⚠️ Monitor already active for user ${userId}, stopping existing one first`);
      const existing = activeMonitors.get(userId);
      if (existing?.socket) {
        existing.socket.close();
      }
      activeMonitors.delete(userId);
    }

    // Start background monitoring task - using setTimeout to start immediately
    setTimeout(() => {
      runChatMonitor(userId, kickUsername, kickUserId?.toString(), monitoringTokenInfo, supabase);
    }, 100);

    console.log(`✅ Monitoring started for @${kickUsername}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Monitoring started for @${kickUsername}`,
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
  console.log(`🤖 Starting persistent chat monitor for @${kickUsername}`);
  
  // CRITICAL: Prevent multiple instances
  if (activeMonitors.has(userId)) {
    console.log(`⚠️ Monitor already exists for user ${userId}, terminating existing one`);
    const existing = activeMonitors.get(userId);
    if (existing?.socket) {
      existing.socket.close();
    }
    activeMonitors.delete(userId);
    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  let isShuttingDown = false;
  
  const connectToChat = async (retryCount = 0): Promise<void> => {
    if (isShuttingDown) return;
    
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

      console.log(`📡 Connecting to chatroom ${chatroomId} for @${kickUsername} (attempt ${retryCount + 1})`);

      // Connect to Kick's Pusher WebSocket
      const pusherUrl = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";
      const kickSocket = new WebSocket(pusherUrl);

      // Store active monitor IMMEDIATELY to prevent race conditions
      const monitorInfo = {
        socket: kickSocket,
        userId,
        kickUsername,
        channelId,
        lastHeartbeat: new Date()
      };
      activeMonitors.set(userId, monitorInfo);

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
            
            // Update message count and heartbeat
            const { data: currentMonitor } = await supabase
              .from('chatbot_monitors')
              .select('total_messages_processed')
              .eq('user_id', userId)
              .single();
            
            await supabase
              .from('chatbot_monitors')
              .update({ 
                total_messages_processed: (currentMonitor?.total_messages_processed || 0) + 1,
                last_heartbeat: new Date().toISOString()
              })
              .eq('user_id', userId);

            // Update in-memory heartbeat
            const monitor = activeMonitors.get(userId);
            if (monitor) {
              monitor.lastHeartbeat = new Date();
            }

            // Check if message is a command
            if (messageData.content?.startsWith('!')) {
              const command = messageData.content.substring(1).split(' ')[0].toLowerCase();
              console.log(`🎯 Auto-processing command: !${command} from @${messageData.sender?.username} in channel @${kickUsername}`);

              await processCommandBackground(command, messageData, userId, tokenInfo, chatroomId, supabase);
            }
          }
        } catch (error) {
          console.error("❌ Error processing chat message:", error);
        }
      };

      kickSocket.onerror = async (error) => {
        console.error(`❌ WebSocket error for @${kickUsername}:`, error);
        activeMonitors.delete(userId);
        
        // Attempt to reconnect after a delay if retries are available
        if (retryCount < 5) {
          console.log(`🔄 Attempting to reconnect in ${Math.pow(2, retryCount)} seconds...`);
          setTimeout(() => connectToChat(retryCount + 1), Math.pow(2, retryCount) * 1000);
        } else {
          // Mark monitor as inactive after max retries
          await supabase
            .from('chatbot_monitors')
            .update({ is_active: false })
            .eq('user_id', userId);
        }
      };

      kickSocket.onclose = async (event) => {
        console.log(`🔌 WebSocket disconnected for @${kickUsername} (code: ${event.code})`);
        activeMonitors.delete(userId);
        
        // Only attempt reconnect if it wasn't a manual close (code 1000)
        if (event.code !== 1000 && retryCount < 5) {
          console.log(`🔄 Attempting to reconnect in ${Math.pow(2, retryCount)} seconds...`);
          setTimeout(() => connectToChat(retryCount + 1), Math.pow(2, retryCount) * 1000);
        } else if (event.code === 1000 || retryCount >= 5) {
          // Mark monitor as inactive
          await supabase
            .from('chatbot_monitors')
            .update({ is_active: false })
            .eq('user_id', userId);
        }
      };

    } catch (error) {
      console.error(`❌ Error in chat monitor for @${kickUsername}:`, error);
      
      // Attempt to reconnect after a delay if retries are available
      if (retryCount < 5) {
        console.log(`🔄 Attempting to reconnect in ${Math.pow(2, retryCount)} seconds...`);
        setTimeout(() => connectToChat(retryCount + 1), Math.pow(2, retryCount) * 1000);
      } else {
        // Mark monitor as inactive after max retries
        await supabase
          .from('chatbot_monitors')
          .update({ is_active: false })
          .eq('user_id', userId);
      }
    }
  };

  // Start the initial connection
  await connectToChat();
}

async function processCommandBackground(command: string, messageData: any, userId: string, tokenInfo: any, chatroomId: string, supabase: any) {
  try {
    console.log(`🎯 Processing command: !${command} from @${messageData.sender?.username} for user: ${userId}`);

    // Special handling for slots calls (!kgs command)
    if (command === 'kgs') {
      console.log(`🎰 Handling slots call !kgs`);
      await processSlotsCall(messageData, chatroomId, userId, supabase);
      return;
    }

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
    await sendBotMessage(commands.response, tokenInfo.access_token, chatroomId);
    
    // Update usage stats
    await supabase
      .from('commands')
      .update({ uses: commands.uses + 1 })
      .eq('id', commands.id);

    const { data: currentMonitor } = await supabase
      .from('chatbot_monitors')
      .select('total_commands_processed')
      .eq('user_id', userId)
      .single();
      
    await supabase
      .from('chatbot_monitors')
      .update({ 
        total_commands_processed: (currentMonitor?.total_commands_processed || 0) + 1,
        last_heartbeat: new Date().toISOString()
      })
      .eq('user_id', userId);

    console.log(`✅ Auto-processed command !${command}`);

  } catch (error) {
    console.error(`❌ Error processing command !${command}:`, error);
  }
}

async function sendBotMessage(message: string, token: string, chatroomId: string) {
  try {
    const response = await fetch(`https://api.kick.com/public/v1/chat/send/${chatroomId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
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

async function processSlotsCall(messageData: any, chatroomId: string, userId: string, supabase: any) {
  try {
    console.log(`🎰 Processing slots call from ${messageData.sender?.username} for user ${userId}`);
    console.log(`🎰 Message content: "${messageData.content}"`);
    
    // Extract slot name from message (everything after !kgs )
    const slotName = messageData.content?.replace('!kgs ', '').trim();
    const username = messageData.sender?.username;
    const kickUserId = messageData.sender?.id?.toString();
    
    if (!slotName || !username) {
      console.log(`❌ Invalid slots call: missing slot name or username`);
      return;
    }

    // Get the user's profile to find their channel username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kick_username, linked_kick_username')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.log(`❌ No profile found for user: ${userId}`);
      return;
    }

    const channelUsername = profile.linked_kick_username || profile.kick_username;
    console.log(`🎯 Looking for slots event - Channel: ${channelUsername}, Status: active`);

    // Find active slots event for this channel (ANY user can create events for ANY channel)
    const { data: activeEvent, error: eventError } = await supabase
      .from('slots_events')
      .select('*')
      .eq('status', 'active')
      .eq('channel_id', channelUsername)
      .maybeSingle();
    
    console.log(`📊 Event lookup result:`, { 
      activeEvent: activeEvent ? `${activeEvent.title} (${activeEvent.id})` : null, 
      eventError, 
      channelUsername,
      status: 'active'
    });

    if (eventError || !activeEvent) {
      console.log(`❌ No active slots event found for channel: ${channelUsername}`);
      return;
    }

    console.log(`✅ Found active slots event: ${activeEvent.title} for ${channelUsername}`);

    // Check if user has already called this exact slot for this event
    const { data: existingSlotCall, error: slotCallError } = await supabase
      .from('slots_calls')
      .select('id')
      .eq('event_id', activeEvent.id)
      .eq('viewer_kick_id', kickUserId)
      .eq('slot_name', slotName)
      .single();

    if (slotCallError && slotCallError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`❌ Error checking existing slot call:`, slotCallError);
      return;
    }

    if (existingSlotCall) {
      console.log(`⚠️ Duplicate call prevented: ${username} already called ${slotName}`);
      return;
    }

    // Check if user has reached max calls per user for this event
    const { data: existingCalls, error: callsError } = await supabase
      .from('slots_calls')
      .select('*')
      .eq('event_id', activeEvent.id)
      .eq('viewer_kick_id', kickUserId);

    if (callsError) {
      console.error(`❌ Error checking existing calls:`, callsError);
      return;
    }

    if (existingCalls && existingCalls.length >= activeEvent.max_calls_per_user) {
      console.log(`❌ User ${username} has reached max calls (${activeEvent.max_calls_per_user})`);
      return;
    }

    // Get the next call order
    const { data: callOrder, error: orderError } = await supabase
      .rpc('get_next_call_order', { event_uuid: activeEvent.id });

    if (orderError) {
      console.error(`❌ Error getting call order:`, orderError);
      return;
    }

    // Insert the slots call
    const { error: insertError } = await supabase
      .from('slots_calls')
      .insert({
        event_id: activeEvent.id,
        viewer_username: username,
        viewer_kick_id: kickUserId,
        slot_name: slotName,
        bet_amount: activeEvent.bet_size,
        call_order: callOrder,
        status: 'pending'
      });

    if (insertError) {
      console.error(`❌ Error inserting slots call:`, insertError);
      return;
    }

    console.log(`✅ Slots call recorded: ${username} called ${slotName} (order: ${callOrder})`);

    // Update command stats
    const { data: currentMonitor } = await supabase
      .from('chatbot_monitors')
      .select('total_commands_processed')
      .eq('user_id', userId)
      .single();
      
    await supabase
      .from('chatbot_monitors')
      .update({ 
        total_commands_processed: (currentMonitor?.total_commands_processed || 0) + 1,
        last_heartbeat: new Date().toISOString()
      })
      .eq('user_id', userId);

  } catch (error) {
    console.error(`❌ Error processing slots call:`, error);
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

async function sendUserMessage(message: string, _userToken: string, userId: string, supabase: any): Promise<Response> {
  try {
    console.log(`🤖 Sending bot message: "${message.substring(0, 50)}..." for user: ${userId}`);
    
    // Get bot token from environment (APP token, not user token)
    const botToken = Deno.env.get('KICK_BOT_TOKEN');
    if (!botToken) {
      throw new Error('Bot token not configured');
    }
    
    // Get the user's chatroom ID from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kick_channel_id, kick_username')
      .eq('user_id', userId)
      .maybeSingle();
    
    console.log(`🔍 Profile lookup result:`, { profile, profileError });
    
    if (profileError) {
      console.error(`❌ Database error fetching profile:`, profileError);
      throw new Error(`Database error: ${profileError.message}`);
    }
    
    if (!profile?.kick_channel_id) {
      throw new Error('No chatroom ID found for user');
    }
    
    // Use the correct Kick Chat API endpoint
    const response = await fetch(`https://kick.com/api/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        chatroom_id: profile.kick_channel_id,
        content: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Kick API error: ${response.status} - ${errorText}`);
      throw new Error(`Kick API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log(`✅ Bot message sent successfully:`, responseData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Bot message sent successfully",
        data: responseData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error(`❌ Failed to send bot message:`, error);
    
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

// Health check and auto-restart functionality
setInterval(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for monitors that should be active but aren't connected
    const { data: activeDbMonitors } = await supabase
      .from('chatbot_monitors')
      .select('*')
      .eq('is_active', true);
    
    if (activeDbMonitors) {
      for (const monitor of activeDbMonitors) {
        // CRITICAL: Only restart if truly disconnected AND not already starting
        const isConnected = activeMonitors.has(monitor.user_id);
        
        if (!isConnected) {
          console.log(`🔄 Auto-restarting disconnected monitor for user: ${monitor.user_id}`);
          
          // Get user's token info from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', monitor.user_id)
            .single();
          
          if (profile && profile.kick_username) {
            // Restart the monitor with stored info - using setTimeout to prevent blocking
            setTimeout(() => {
              runChatMonitor(
                monitor.user_id, 
                monitor.kick_username, 
                monitor.channel_id, 
                { access_token: Deno.env.get('KICK_BOT_TOKEN') }, // Use bot token for auto-restart
                supabase
              );
            }, 1000);
          }
        }
      }
    }
    
    // Clean up stale monitors (older than 10 minutes without heartbeat)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    for (const [userId, monitor] of activeMonitors.entries()) {
      if (monitor.lastHeartbeat < tenMinutesAgo) {
        console.log(`🧹 Cleaning up stale monitor for user: ${userId}`);
        monitor.socket.close();
        activeMonitors.delete(userId);
        
        await supabase
          .from('chatbot_monitors')
          .update({ is_active: false })
          .eq('user_id', userId);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in health check:', error);
  }
}, 60000); // Run every minute

serve(handler);