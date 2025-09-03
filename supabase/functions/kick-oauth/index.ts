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

// PKCE helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

Deno.serve(async (req) => {
  console.log('🚀 Kick OAuth function called with method:', req.method)
  console.log('🚀 Request URL:', req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let action = url.searchParams.get('action')
    
    // If no action in URL, check request body for POST requests
    if (!action && req.method === 'POST') {
      const body = await req.json()
      action = body.action
      
      // For authorize action, also get the origin from body
      if (action === 'authorize' && body.origin) {
        url.searchParams.set('origin', body.origin)
      }
    }
    
    console.log('🎯 Action determined:', action)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'authorize') {
      // Generate authorization URL
      const clientId = Deno.env.get('KICK_CLIENT_ID')!
      const frontendUrl = url.searchParams.get('origin') || 'https://kick-spin-chatter.lovable.app'
      const redirectUri = `${frontendUrl}/auth/callback`
      
      console.log('🔧 OAuth Debug - Client ID exists:', !!clientId)
      console.log('🔧 OAuth Debug - Frontend URL:', frontendUrl)
      console.log('🔧 OAuth Debug - Redirect URI:', redirectUri)
      
      const state = crypto.randomUUID()
      const scopes = ['user:read'].join(' ')
      
      // Generate PKCE parameters (required by Kick)
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      
      const authUrl = new URL('https://id.kick.com/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      console.log('🔗 Generated authorization URL:', authUrl.toString())

      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        state,
        codeVerifier // Store this for the token exchange
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'exchange') {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const codeVerifier = url.searchParams.get('code_verifier') // This should come from the client
      const origin = url.searchParams.get('origin') || 'https://kick-spin-chatter.lovable.app'
      
      if (!code) {
        throw new Error('No authorization code received')
      }

      console.log('🔄 Processing OAuth callback with code:', code.substring(0, 10) + '...')

      // Exchange code for access token
      const clientId = Deno.env.get('KICK_CLIENT_ID')!
      const clientSecret = Deno.env.get('KICK_CLIENT_SECRET')!
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
          code_verifier: codeVerifier || '', // PKCE code verifier
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('❌ Token exchange failed:', errorText)
        throw new Error(`Token exchange failed: ${tokenResponse.status}`)
      }

      const tokenData: KickTokenResponse = await tokenResponse.json()
      console.log('✅ Successfully exchanged code for token')

      // Get user info from Kick API
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

      // Create or update user in Supabase Auth
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
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: kickUser.display_name || kickUser.username,
          kick_user_id: kickUser.id.toString(),
          kick_username: kickUser.username,
          avatar_url: kickUser.avatar,
          is_streamer: true, // Assume Kick users are streamers
        }, {
          onConflict: 'user_id'
        })

      if (profileError) {
        console.error('❌ Failed to update profile:', profileError)
      }

      // Generate session for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${kickUser.username}@kick.placeholder`,
      })

      if (sessionError) {
        console.error('❌ Failed to generate session:', sessionError)
        throw sessionError
      }

      console.log('🎉 OAuth flow completed for user:', kickUser.username)

      // Return success data instead of redirecting
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

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('🚨 OAuth error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'OAuth flow failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})