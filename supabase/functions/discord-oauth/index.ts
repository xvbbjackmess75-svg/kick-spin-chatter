import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, code, state } = await req.json()

    const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!
    const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!
    const DISCORD_REDIRECT_URI = `${req.headers.get('origin') || 'https://kick-spin-chatter.lovable.app'}/discord/callback`

    if (action === 'authorize') {
      // Generate Discord OAuth URL
      const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize')
      discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID)
      discordAuthUrl.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI)
      discordAuthUrl.searchParams.set('response_type', 'code')
      discordAuthUrl.searchParams.set('scope', 'identify')
      discordAuthUrl.searchParams.set('state', state)

      return new Response(
        JSON.stringify({
          url: discordAuthUrl.toString(),
          state
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'exchange') {
      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: DISCORD_REDIRECT_URI,
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text()
        console.error('Discord token exchange error:', errorData)
        throw new Error(`Discord token exchange failed: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()

      // Get user info from Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch Discord user info')
      }

      const userData = await userResponse.json()

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          user: {
            id: userData.id,
            username: userData.username,
            discriminator: userData.discriminator,
            avatar: userData.avatar,
            global_name: userData.global_name,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Discord OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})