import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        const { channelName } = data;
        console.log(`Attempting to join Kick channel: ${channelName}`);

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

          kickSocket.onmessage = (event) => {
            try {
              const pusherData = JSON.parse(event.data);
              console.log("Received from Kick:", pusherData);

              // Handle chat messages
              if (pusherData.event === 'App\\Events\\ChatMessageEvent') {
                const messageData = JSON.parse(pusherData.data);
                console.log("Chat message:", messageData);

                // Forward chat message to client
                socket.send(JSON.stringify({
                  type: 'chat_message',
                  data: {
                    id: messageData.id,
                    content: messageData.content,
                    username: messageData.sender?.username,
                    userId: messageData.sender?.id,
                    timestamp: messageData.created_at
                  }
                }));
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