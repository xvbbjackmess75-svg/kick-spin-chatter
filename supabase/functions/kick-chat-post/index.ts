import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('📝 Request body:', JSON.stringify(body))
    
    const { message, authToken } = body

    if (!message || !authToken) {
      console.error('❌ Missing required parameters')
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: message, authToken' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the authenticated user from the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authToken)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return new Response(JSON.stringify({ 
        error: 'Authentication failed' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('👤 Authenticated user:', user.email)

    // Get the user's linked Kick channel from their profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('kick_username, kick_channel_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.kick_username) {
      console.error('❌ User profile or Kick account not found:', profileError)
      return new Response(JSON.stringify({ 
        error: 'You must have a linked Kick account to post messages' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📺 User's Kick channel: ${profile.kick_username}`)

    // Get the admin's Kick access token - prioritize admin with Kick account
    const { data: adminRoles, error: adminRoleError } = await supabaseClient
      .from('user_roles')
      .select(`
        user_id,
        profiles!inner(
          linked_kick_username,
          linked_kick_user_id
        )
      `)
      .eq('role', 'admin')
      .not('profiles.linked_kick_username', 'is', null)
      .limit(1)

    console.log('🔍 Admin query result:', JSON.stringify(adminRoles, null, 2))

    if (adminRoleError || !adminRoles || adminRoles.length === 0) {
      console.error('❌ No admin with linked Kick account found:', adminRoleError)
      return new Response(JSON.stringify({ 
        error: 'No admin account with linked Kick account found. Admin must link their Kick account first.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminUserId = adminRoles[0].user_id
    console.log('👨‍💼 Using admin user ID:', adminUserId)

    // Get admin's auth data to access their Kick token
    const { data: adminUser, error: adminUserError } = await supabaseClient.auth.admin.getUserById(adminUserId)
    
    console.log('🔍 Admin user query error:', adminUserError)
    console.log('🔍 Admin user data structure:', JSON.stringify(adminUser, null, 2))
    
    if (adminUserError || !adminUser.user) {
      console.error('❌ Admin user not found:', adminUserError)
      return new Response(JSON.stringify({ 
        error: 'Admin account not found',
        details: adminUserError?.message || 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('🔍 Admin user metadata:', JSON.stringify(adminUser.user.user_metadata, null, 2))
    console.log('🔍 Admin app metadata:', JSON.stringify(adminUser.user.app_metadata, null, 2))

    const adminKickToken = adminUser.user.user_metadata?.kick_access_token
    
    console.log('🔍 Admin Kick token exists:', !!adminKickToken)
    console.log('🔍 Admin Kick token (first 10 chars):', adminKickToken?.substring(0, 10))
    
    if (!adminKickToken) {
      console.error('❌ Admin Kick token not found. Admin needs to link Kick account via OAuth.')
      console.error('💡 Admin user metadata keys:', Object.keys(adminUser.user.user_metadata || {}))
      return new Response(JSON.stringify({ 
        error: 'Admin Kick account not linked. Please contact administrator to link their Kick account via OAuth.',
        details: 'The admin account must go through Kick OAuth to obtain an access token before chat posting can work.',
        adminUserId: adminUserId,
        hasMetadata: !!adminUser.user.user_metadata,
        metadataKeys: Object.keys(adminUser.user.user_metadata || {})
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    console.log('🔑 Using admin Kick token for posting')

    const channelName = profile.kick_username

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

    // Now post the message to the chat using admin's token
    const postResponse = await fetch(`https://kick.com/api/v2/messages/send/${channelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminKickToken}`,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('🚨 Function error:', errorMessage)
    console.error('🚨 Error stack:', errorStack)
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})