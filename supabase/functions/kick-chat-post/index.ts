const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🚀 Kick Chat Post function started')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📝 Request body:', JSON.stringify(body))
    
    const { channelName, message, kickAccessToken } = body

    if (!channelName || !message || !kickAccessToken) {
      console.error('❌ Missing required parameters')
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: channelName, message, kickAccessToken' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📨 Attempting to post message to channel: ${channelName}`)
    console.log(`📝 Message: ${message}`)

    // First, get the channel ID from the channel name
    const channelResponse = await fetch(`https://kick.com/api/v2/channels/${channelName}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KickBot/1.0'
      },
    })

    console.log('🔍 Channel lookup response status:', channelResponse.status)

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text()
      console.error('❌ Channel lookup failed:', errorText)
      return new Response(JSON.stringify({ 
        error: `Channel lookup failed: ${channelResponse.status} - ${errorText}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const channelData = await channelResponse.json()
    console.log('📊 Channel data received:', JSON.stringify(channelData, null, 2))

    const channelId = channelData.chatroom?.id
    if (!channelId) {
      console.error('❌ Could not find channel ID')
      return new Response(JSON.stringify({ 
        error: 'Could not find channel ID for the specified channel' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`🎯 Found channel ID: ${channelId}`)

    // Now post the message to the chat
    const postResponse = await fetch(`https://kick.com/api/v2/messages/send/${channelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kickAccessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'KickBot/1.0'
      },
      body: JSON.stringify({
        content: message,
        type: 'message'
      }),
    })

    console.log('📤 Post message response status:', postResponse.status)
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      console.error('❌ Message post failed:', errorText)
      return new Response(JSON.stringify({ 
        error: `Message post failed: ${postResponse.status} - ${errorText}`,
        details: errorText
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const postResult = await postResponse.json()
    console.log('✅ Message posted successfully:', JSON.stringify(postResult, null, 2))

    return new Response(JSON.stringify({
      success: true,
      message: 'Message posted successfully',
      channelId: channelId,
      channelName: channelName,
      postedMessage: message,
      result: postResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('🚨 Function error:', error.message)
    console.error('🚨 Error stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})