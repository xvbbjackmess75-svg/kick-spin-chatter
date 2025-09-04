import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KickChatRequest {
  action: 'send_message' | 'process_command';
  channel_id?: string;
  message?: string;
  command?: string;
  user?: {
    username: string;
    user_id: string;
    user_level: 'viewer' | 'subscriber' | 'moderator' | 'owner';
  };
  token_info?: {
    access_token: string;
    refresh_token?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Kick Chat API function started");
    
    const body: KickChatRequest = await req.json();
    console.log("📦 Request body:", { action: body.action, channel_id: body.channel_id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (body.action) {
      case 'send_message':
        return await sendMessage(body);
      
      case 'process_command':
        return await processCommand(body, supabase);
      
      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

  } catch (error: any) {
    console.error("❌ Error in kick-chat-api function:", error);
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

async function sendMessage(body: KickChatRequest): Promise<Response> {
  const { channel_id, message, token_info } = body;
  
  if (!channel_id || !message || !token_info?.access_token) {
    throw new Error("Missing required parameters for send_message");
  }

  console.log(`📤 Sending message to channel ${channel_id}: ${message.substring(0, 50)}...`);

  // Validate the user has permission to send messages to this channel
  // by checking if they own it via the token
  try {
    // First verify the token by getting user info
    const userResponse = await fetch('https://api.kick.com/public/v1/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token_info.access_token}`,
        'Accept': 'application/json',
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Token validation failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log(`🔍 Token validated for user: ${userData.data?.[0]?.name}`);
    
    // Send message using Kick Chat API (correct endpoint)
    const response = await fetch('https://api.kick.com/public/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token_info.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        type: 'bot', // Use bot type since we're sending as a bot
        content: message
        // broadcaster_user_id is not required for bot type and will be ignored
      })
    });

    console.log(`🔍 Kick API response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`🔍 Kick API response body: ${responseText.substring(0, 200)}...`);

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        is_sent: data.data?.is_sent,
        message_id: data.data?.message_id,
        content: message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

async function processCommand(body: KickChatRequest, supabase: any): Promise<Response> {
  const { command, user, channel_id, token_info } = body;
  
  if (!command || !user || !channel_id) {
    throw new Error("Missing required parameters for process_command");
  }

  console.log(`⚡ Processing command: ${command} from user: ${user.username} (${user.user_level})`);

  // Find matching command in database
  const { data: commands, error } = await supabase
    .from('commands')
    .select('*')
    .eq('command', command)
    .eq('enabled', true)
    .single();

  if (error || !commands) {
    console.log(`❌ Command not found: ${command}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Command not found" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`✅ Found command: ${commands.command} - Response: ${commands.response}`);

  // Check user level permissions
  const hasPermission = checkUserPermission(user.user_level, commands.user_level);
  if (!hasPermission) {
    console.log(`🚫 Permission denied for user ${user.username} (${user.user_level}) to use ${commands.user_level} command`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Insufficient permissions" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Check cooldown (TODO: implement cooldown tracking)
  
  // Send command response
  if (token_info?.access_token) {
    const messageResponse = await sendMessage({
      action: 'send_message',
      channel_id,
      message: commands.response,
      token_info
    });

    if (messageResponse.ok) {
      // Update command usage count
      await supabase
        .from('commands')
        .update({ uses: commands.uses + 1 })
        .eq('id', commands.id);

      console.log(`📈 Updated usage count for command: ${commands.command}`);
    }

    return messageResponse;
  } else {
    // Return the response without sending (for testing)
    return new Response(
      JSON.stringify({ 
        success: true, 
        response: commands.response,
        command: commands.command
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
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

serve(handler);