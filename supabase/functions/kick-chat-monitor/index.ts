import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global variables to store bot token and channel name
let botToken: string | null = null;
let globalChannelName: string | null = null;

async function processCommand(command: string, messageData: any, chatroomId: string, socket: WebSocket) {
  try {
    console.log(`🔧 Processing command: !${command}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Special handling for slots calls (!kgs command)
    if (command === 'kgs') {
      await processSlotsCall(messageData, chatroomId, socket, supabase, globalChannelName);
      return;
    }

    // Look up command in database
    const { data: commands, error } = await supabase
      .from('commands')
      .select('*')
      .eq('command', command)
      .eq('enabled', true)
      .single();

    if (error || !commands) {
      console.log(`❌ Command not found: !${command}`);
      return;
    }

    console.log(`✅ Found command: !${commands.command} - Response: ${commands.response}`);

    // Check user level permissions (simplified for now)
    const userLevel = getUserLevel(messageData.sender);
    const hasPermission = checkUserPermission(userLevel, commands.user_level);
    
    if (!hasPermission) {
      console.log(`🚫 Permission denied for user ${messageData.sender?.username} (${userLevel})`);
      return;
    }

    // Send command response if we have a bot token
    if (botToken) {
      await sendBotMessage(commands.response, botToken);
      
      // Update command usage count
      await supabase
        .from('commands')
        .update({ uses: commands.uses + 1 })
        .eq('id', commands.id);

      // Notify client that command was processed
      socket.send(JSON.stringify({
        type: 'command_processed',
        command: commands.command,
        response: commands.response,
        user: messageData.sender?.username
      }));

      console.log(`📈 Command !${command} processed and response sent`);
    } else {
      console.log(`⚠️ No bot token available, cannot send response`);
    }

  } catch (error) {
    console.error(`❌ Error processing command !${command}:`, error);
  }
}

async function processSlotsCall(messageData: any, chatroomId: string, socket: WebSocket, supabase: any, channelName?: string) {
  try {
    console.log(`🎰 Processing slots call from ${messageData.sender?.username}`);
    console.log(`🎰 Full message content: "${messageData.content}"`);
    
    // Extract slot name from message (everything after !kgs )
    const messageContent = messageData.content || '';
    const slotName = messageContent.replace(/^!kgs\s*/, '').trim();
    const username = messageData.sender?.username;
    const kickUserId = messageData.sender?.id?.toString();
    
    console.log(`🎰 Extracted slot name: "${slotName}"`);
    
    if (!slotName || !username) {
      console.log(`❌ Invalid slots call: missing slot name or username. Content: "${messageContent}"`);
      return;
    }

    // Find active slots event for this streamer's channel  
    // Use the channel name (streamer username) to match events
    const { data: activeEvent, error: eventError } = await supabase
      .from('slots_events')
      .select('*')
      .eq('status', 'active')
      .eq('channel_id', channelName) // Use the channel name from WebSocket connection
      .single();

    if (eventError || !activeEvent) {
      console.log(`❌ No active slots event found for channel: ${channelName}`);
      return;
    }

    // Check if user has exceeded their call limit
    const { count: userCallsCount } = await supabase
      .from('slots_calls')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', activeEvent.id)
      .eq('viewer_username', username);

    if ((userCallsCount || 0) >= activeEvent.max_calls_per_user) {
      console.log(`🚫 User ${username} has reached call limit for event ${activeEvent.id}`);
      
      if (botToken) {
        await sendBotMessage(
          `@${username} You've reached the maximum number of calls (${activeEvent.max_calls_per_user}) for this event!`, 
          botToken
        );
      }
      return;
    }

    // Get next call order
    const { data: orderData } = await supabase
      .rpc('get_next_call_order', { event_uuid: activeEvent.id });

    // Add the call to the database
    const { error: insertError } = await supabase
      .from('slots_calls')
      .insert({
        event_id: activeEvent.id,
        viewer_username: username,
        viewer_kick_id: kickUserId,
        slot_name: slotName,
        bet_amount: activeEvent.bet_size,
        status: 'pending',
        call_order: orderData || 1
      });

    if (insertError) {
      console.error(`❌ Error inserting slots call:`, insertError);
      return;
    }

    console.log(`✅ Slots call added: ${username} -> ${slotName}`);

    // Send confirmation message
    if (botToken) {
      await sendBotMessage(
        `@${username} Your call for ${slotName} has been added to the queue! (Bet: $${activeEvent.bet_size})`, 
        botToken
      );
    }

    // Notify client about the new slots call
    socket.send(JSON.stringify({
      type: 'slots_call_added',
      event_id: activeEvent.id,
      viewer_username: username,
      slot_name: slotName,
      bet_amount: activeEvent.bet_size,
      call_order: orderData || 1
    }));

  } catch (error) {
    console.error(`❌ Error processing slots call:`, error);
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

    console.log(`✅ Bot message sent: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error(`❌ Failed to send bot message:`, error);
  }
}

function getUserLevel(sender: any): string {
  // Simplified user level detection - you can enhance this
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
    'subscriber': 1,
    'moderator': 2,
    'owner': 3
  };

  const userLevelNum = levels[userLevel as keyof typeof levels] || 0;
  const requiredLevelNum = levels[requiredLevel as keyof typeof levels] || 0;

  return userLevelNum >= requiredLevelNum;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let kickSocket: WebSocket | null = null;
  let isConnected = false;

  socket.onopen = () => {
    console.log("Client connected to Kick chat monitor");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received from client:", data);

      if (data.type === 'join_channel') {
        const { channelName, token } = data;
        console.log(`Attempting to join Kick channel: ${channelName}`);
        
        // Store the channel name and bot token for command responses
        globalChannelName = channelName;
        if (token) {
          botToken = token;
          console.log(`✅ Bot token received and stored`);
        }

        try {
          // Get channel info to find chatroom ID
          const channelResponse = await fetch(`https://kick.com/api/v2/channels/${channelName}`);
          
          if (!channelResponse.ok) {
            throw new Error(`Channel not found: ${channelName}`);
          }

          const channelData = await channelResponse.json();
          const chatroomId = channelData.chatroom?.id;

          if (!chatroomId) {
            throw new Error(`No chatroom found for channel: ${channelName}`);
          }

          console.log(`Found chatroom ID: ${chatroomId} for channel: ${channelName}`);

          // Connect to Kick's Pusher WebSocket
          const pusherUrl = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";
          
          if (kickSocket) {
            kickSocket.close();
          }

          kickSocket = new WebSocket(pusherUrl);

          kickSocket.onopen = () => {
            console.log("Connected to Kick Pusher WebSocket");
            
            // Subscribe to the chatroom channel
            const subscribeMessage = {
              event: "pusher:subscribe",
              data: {
                channel: `chatrooms.${chatroomId}.v2`
              }
            };
            
            console.log("Subscribing to channel:", `chatrooms.${chatroomId}.v2`);
            kickSocket?.send(JSON.stringify(subscribeMessage));
            
            isConnected = true;
            socket.send(JSON.stringify({
              type: 'connected',
              channelName,
              chatroomId
            }));
          };

          kickSocket.onmessage = async (event) => {
            try {
              const pusherData = JSON.parse(event.data);
              console.log("Received from Kick:", pusherData);

              // Handle chat messages
              if (pusherData.event === 'App\\Events\\ChatMessageEvent') {
                const messageData = JSON.parse(pusherData.data);
                console.log("Chat message:", messageData);

                const chatMessage = {
                  id: messageData.id,
                  content: messageData.content,
                  username: messageData.sender?.username,
                  userId: messageData.sender?.id,
                  timestamp: messageData.created_at,
                  chatroomId: chatroomId
                };

                // Forward chat message to client
                socket.send(JSON.stringify({
                  type: 'chat_message',
                  data: chatMessage
                }));

                // Check if message is a command (starts with !)
                if (messageData.content?.startsWith('!')) {
                  const command = messageData.content.substring(1).split(' ')[0].toLowerCase();
                  console.log(`🎯 Command detected: !${command} from user: ${messageData.sender?.username}`);

                  // Process command
                  await processCommand(command, messageData, chatroomId, socket);
                }
              }
            } catch (error) {
              console.error("Error parsing Kick message:", error);
            }
          };

          kickSocket.onerror = (error) => {
            console.error("Kick WebSocket error:", error);
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Kick WebSocket error'
            }));
          };

          kickSocket.onclose = () => {
            console.log("Kick WebSocket disconnected");
            isConnected = false;
            socket.send(JSON.stringify({
              type: 'disconnected'
            }));
          };

        } catch (error) {
          console.error("Error joining channel:", error);
          socket.send(JSON.stringify({
            type: 'error',
            message: `Failed to join channel: ${error.message}`
          }));
        }
      }
    } catch (error) {
      console.error("Error handling client message:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  };

  socket.onclose = () => {
    console.log("Client disconnected");
    if (kickSocket) {
      kickSocket.close();
    }
  };

  return response;
});