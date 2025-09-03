const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🚀 Function started')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 Reading request body...')
    const body = await req.json()
    console.log('🔧 Body received:', JSON.stringify(body))
    
    const action = body.action

    if (action === 'authorize') {
      console.log('🔧 Authorize action')
      
      const clientId = '01K48PAFGDJXCP7V52WK8ZCYCJ'
      const frontendUrl = body.origin || 'https://kick-spin-chatter.lovable.app'
      const redirectUri = `${frontendUrl}/auth/callback`
      
      const state = crypto.randomUUID()
      // Request more comprehensive scopes for user data access
      const scopes = ['user:read', 'profile:read', 'channel:read'].join(' ')
      
      // Generate PKCE parameters
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      const codeVerifier = btoa(String.fromCharCode(...Array.from(array)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
      
      const encoder = new TextEncoder()
      const data = encoder.encode(codeVerifier)
      const digest = await crypto.subtle.digest('SHA-256', data)
      const codeChallenge = btoa(String.fromCharCode(...Array.from(new Uint8Array(digest))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
      
      const authUrl = new URL('https://id.kick.com/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      console.log('🔗 Authorization URL created successfully')

      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        state,
        codeVerifier
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'exchange') {
      console.log('🔧 Exchange action starting')
      
      const code = body.code
      const codeVerifier = body.code_verifier
      const origin = body.origin || 'https://kick-spin-chatter.lovable.app'
      
      console.log('🔧 Params received successfully')
      
      if (!code || !codeVerifier) {
        console.error('❌ Missing required params')
        throw new Error('Missing code or code verifier')
      }

      console.log('🔧 Starting Kick token exchange...')
      const clientId = '01K48PAFGDJXCP7V52WK8ZCYCJ'
      const clientSecret = '4f9941ca9147c4ea96e6612ef140a3761760daa479bba1f36023ce4616063105'
      const redirectUri = `${origin}/auth/callback`

      const tokenResponse = await fetch('https://id.kick.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code,
          code_verifier: codeVerifier,
        }),
      })

      console.log('🔧 Token response received:', tokenResponse.status)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('❌ Token exchange failed:', errorText)
        return new Response(JSON.stringify({ 
          error: `Token exchange failed: ${tokenResponse.status} - ${errorText}`,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const tokenData = await tokenResponse.json()
      console.log('✅ Token exchange successful')

      console.log('🔧 Getting user info...')
      let kickUser = null
      
      // Check if user info is included in token response first
      if (tokenData.user) {
        kickUser = tokenData.user
        console.log('✅ User info found in token response:', kickUser.username || kickUser.name)
      } else {
        // Use the correct Kick API endpoint for authenticated user
        try {
          console.log('🔧 Attempting API call to: https://kick.com/api/v1/user')
          console.log('🔧 Using access token:', tokenData.access_token ? `${tokenData.access_token.substring(0, 10)}...` : 'NO TOKEN')
          
          const userResponse = await fetch('https://kick.com/api/v1/user', {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Accept': 'application/json',
              'User-Agent': 'KickBot/1.0',
              'Content-Type': 'application/json'
            },
          })
          
          console.log('🔧 User API response status:', userResponse.status)
          console.log('🔧 User API response statusText:', userResponse.statusText)
          console.log('🔧 User API response headers:', JSON.stringify(Object.fromEntries(userResponse.headers.entries())))
          
          const responseText = await userResponse.text()
          console.log('🔧 User API raw response length:', responseText.length)
          console.log('🔧 User API response body (first 500 chars):', responseText.substring(0, 500))
          console.log('🔧 Response starts with JSON?', responseText.trim().startsWith('{'))
          
          if (userResponse.ok) {
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              const userData = JSON.parse(responseText)
              console.log('✅ User data retrieved successfully')
              console.log('🔧 Full user data structure:', JSON.stringify(userData, null, 2))
              console.log('🔧 Available user fields:', Object.keys(userData))
              
              // Extract user info - handle different possible field names
              kickUser = {
                id: userData.id || userData.user_id || userData.userId || `kick_${Date.now()}`,
                username: userData.username || userData.name || userData.display_name || userData.slug || `user_${Date.now()}`,
                display_name: userData.display_name || userData.name || userData.username || userData.full_name || 'Kick User',
                avatar: userData.avatar || userData.avatar_url || userData.profile_picture || userData.profile_pic || null
              }
              
              console.log('✅ Extracted user info:', JSON.stringify(kickUser, null, 2))
            } else {
              console.error('❌ Response is not JSON. Response type might be HTML or other format')
              console.error('❌ Full response:', responseText)
              throw new Error('API returned non-JSON response - likely HTML error page')
            }
          } else {
            console.error('❌ User API failed with status:', userResponse.status, userResponse.statusText)
            console.error('❌ Error response body:', responseText)
            throw new Error(`User API failed with status ${userResponse.status}: ${userResponse.statusText}`)
          }
        } catch (error) {
          console.error('❌ User info fetch failed:', error.message)
          console.error('❌ Error details:', error.stack)
          
          // Create a fallback user with some randomness to avoid conflicts
          const randomId = Math.random().toString(36).substr(2, 8)
          kickUser = {
            id: `fallback_${randomId}`,
            username: `kick_user_${randomId}`,
            display_name: 'Kick User (API Error)',
            avatar: null
          }
          console.log('⚠️ Using fallback user due to API error:', kickUser.username)
        }
      }

      console.log('🎉 Exchange completed successfully')
      console.log('🔍 FINAL USER DATA BEING RETURNED:', JSON.stringify(kickUser, null, 2))

      return new Response(JSON.stringify({
        success: true,
        user: kickUser,
        message: 'Kick OAuth completed successfully',
        debug_info: {
          api_called: 'https://kick.com/api/v1/user',
          user_fields_available: Object.keys(kickUser),
          fallback_used: kickUser.username?.includes('user_') || kickUser.username?.includes('kick_user_')
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.error('❌ Invalid action:', action)
    throw new Error('Invalid action: ' + action)

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