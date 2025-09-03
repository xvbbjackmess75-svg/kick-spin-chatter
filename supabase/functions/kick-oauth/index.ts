import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KickUserInfo {
  id: number
  username: string
  display_name: string
  avatar?: string
  verified: boolean
  follower_badges: any[]
  subscriber_badges: any[]
  bio?: string
}

interface KickTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

Deno.serve(async (req) => {
  console.log('🚀 Function started:', req.method, req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 Starting OAuth flow...')
    
    // Read request body
    const body = await req.json()
    console.log('🔧 Request body action:', body.action)
    
    const action = body.action

    if (action === 'authorize') {
      console.log('🔧 Creating authorization URL...')
      
      const clientId = '01K48PAFGDJXCP7V52WK8ZCYCJ'
      const frontendUrl = body.origin || 'https://kick-spin-chatter.lovable.app'
      const redirectUri = `${frontendUrl}/auth/callback`
      
      console.log('🔧 Client ID:', clientId)
      console.log('🔧 Redirect URI:', redirectUri)
      
      const state = crypto.randomUUID()
      const scopes = ['user:read'].join(' ')
      
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
      
      console.log('🔧 PKCE generated')
      
      const authUrl = new URL('https://id.kick.com/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      console.log('🔗 Authorization URL created')

      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        state,
        codeVerifier
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'exchange') {
      console.log('🔧 Starting token exchange...')
      
      const code = body.code
      const codeVerifier = body.code_verifier
      const origin = body.origin || 'https://kick-spin-chatter.lovable.app'
      
      console.log('🔧 Code exists:', !!code)
      console.log('🔧 Code verifier exists:', !!codeVerifier)
      
      if (!code || !codeVerifier) {
        throw new Error('Missing code or code verifier')
      }

      const clientId = '01K48PAFGDJXCP7V52WK8ZCYCJ'
      const clientSecret = '4f9941ca9147c4ea96e6612ef140a3761760daa479bba1f36023ce4616063105'
      const redirectUri = `${origin}/auth/callback`

      console.log('🔧 Making token request to Kick...')

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

      console.log('🔧 Token response status:', tokenResponse.status)

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

      const tokenData: KickTokenResponse = await tokenResponse.json()
      console.log('✅ Token exchange successful')

      // Get user info from Kick API
      console.log('🔧 Fetching user info from Kick...')
      const userResponse = await fetch('https://kick.com/api/v2/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('❌ Failed to fetch user info:', errorText)
        throw new Error(`Failed to fetch user info: ${userResponse.status}`)
      }

      const kickUser: KickUserInfo = await userResponse.json()
      console.log('👤 Retrieved user info for:', kickUser.username)

      // Initialize Supabase client
      console.log('🔧 Initializing Supabase...')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Create or update user in Supabase Auth
      console.log('🔧 Creating/updating Supabase user...')
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `${kickUser.username}@kick.placeholder`,
        email_confirm: true,
        user_metadata: {
          kick_id: kickUser.id,
          kick_username: kickUser.username,
          display_name: kickUser.display_name,
          avatar_url: kickUser.avatar,
          verified: kickUser.verified,
          provider: 'kick',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        }
      })

      if (authError && !authError.message.includes('already been registered')) {
        console.error('❌ Failed to create user:', authError)
        throw authError
      }

      // If user already exists, update their metadata
      let userId = authData?.user?.id
      if (authError?.message.includes('already been registered')) {
        console.log('🔧 User exists, updating metadata...')
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => 
          u.user_metadata?.kick_id === kickUser.id
        )
        if (existingUser) {
          userId = existingUser.id
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              kick_id: kickUser.id,
              kick_username: kickUser.username,
              display_name: kickUser.display_name,
              avatar_url: kickUser.avatar,
              verified: kickUser.verified,
              provider: 'kick',
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
            }
          })
        }
      }

      if (!userId) {
        throw new Error('Failed to get or create user ID')
      }

      // Update or create profile
      console.log('🔧 Creating/updating profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: kickUser.display_name || kickUser.username,
          kick_user_id: kickUser.id.toString(),
          kick_username: kickUser.username,
          avatar_url: kickUser.avatar,
          is_streamer: true,
        }, {
          onConflict: 'user_id'
        })

      if (profileError) {
        console.error('❌ Failed to update profile:', profileError)
        // Don't throw - profile update is not critical
      }

      // Generate session for the user
      console.log('🔧 Generating session...')
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${kickUser.username}@kick.placeholder`,
      })

      if (sessionError) {
        console.error('❌ Failed to generate session:', sessionError)
        throw sessionError
      }

      console.log('🎉 OAuth flow completed for user:', kickUser.username)

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: kickUser.id,
          username: kickUser.username,
          display_name: kickUser.display_name,
          avatar: kickUser.avatar
        },
        session_data: sessionData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action: ' + action)

  } catch (error) {
    console.error('🚨 Error:', error.message)
    console.error('🚨 Stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})