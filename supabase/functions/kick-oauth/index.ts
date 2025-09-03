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
      // Try multiple endpoints to get user data
      let kickUser = null
      
      // First try the standard user endpoint
      try {
        const userResponse = await fetch('https://kick.com/api/v2/user', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json',
          },
        })
        
        if (userResponse.ok) {
          kickUser = await userResponse.json()
          console.log('✅ User info retrieved from v2/user:', kickUser.username)
        } else {
          console.log('⚠️ v2/user failed, trying alternative endpoint...')
          
          // Try alternative endpoint
          const altResponse = await fetch('https://kick.com/api/v1/user', {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Accept': 'application/json',
            },
          })
          
          if (altResponse.ok) {
            kickUser = await altResponse.json()
            console.log('✅ User info retrieved from v1/user:', kickUser.username)
          } else {
            throw new Error(`Both user endpoints failed: v2 status ${userResponse.status}, v1 status ${altResponse.status}`)
          }
        }
      } catch (error) {
        console.error('❌ User info failed:', error.message)
        // Return success with token data only if user info fails
        return new Response(JSON.stringify({
          success: true,
          user: {
            id: 'unknown',
            username: 'kick_user',
            display_name: 'Kick User',
            avatar: null
          },
          token_info: {
            access_token: tokenData.access_token,
            token_type: tokenData.token_type
          },
          message: 'Authentication successful but user info unavailable'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('🎉 Exchange completed successfully')

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: kickUser.id,
          username: kickUser.username,
          display_name: kickUser.display_name,
          avatar: kickUser.avatar
        },
        message: 'Kick OAuth completed successfully'
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