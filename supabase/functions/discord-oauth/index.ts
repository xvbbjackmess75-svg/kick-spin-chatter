import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { action, code, state, user_id } = await req.json()

    const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!
    const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!
    const DISCORD_REDIRECT_URI = `${req.headers.get('origin') || 'https://kickhelper.app'}/discord/callback`

    console.log('🎮 Discord OAuth action:', action)

    if (action === 'authorize') {
      // Generate Discord OAuth URL
      const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize')
      discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID)
      discordAuthUrl.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI)
      discordAuthUrl.searchParams.set('response_type', 'code')
      discordAuthUrl.searchParams.set('scope', 'identify email')
      discordAuthUrl.searchParams.set('state', state)

      console.log('🔗 Generated Discord OAuth URL')

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
      console.log('🔄 Exchanging Discord code for tokens')
      
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
        console.error('❌ Discord token exchange error:', errorData)
        throw new Error(`Discord token exchange failed: ${tokenResponse.status}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('✅ Got Discord tokens')

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
      console.log('✅ Got Discord user data:', userData.username)

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

    if (action === 'link') {
      console.log('🔗 Linking Discord account to profile for user:', user_id)
      
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const { discord_user_id, discord_username, discord_avatar, discord_discriminator } = await req.json()
      
      // Check if this Discord account is already linked to another profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('linked_discord_user_id', discord_user_id)
        .neq('user_id', user_id)
        .single()
      
      if (existingProfile) {
        console.log('⚠️ Discord account already linked to another profile')
        return new Response(
          JSON.stringify({ 
            error: 'Discord account is already linked to another account' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }
      
      // Get Discord avatar URL
      const avatarUrl = discord_avatar 
        ? `https://cdn.discordapp.com/avatars/${discord_user_id}/${discord_avatar}.png`
        : `https://ui-avatars.com/api/?name=${discord_username}&background=5865F2&color=fff&size=200&bold=true`
      
      // Update the profile with Discord account info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          linked_discord_user_id: discord_user_id,
          linked_discord_username: discord_username,
          linked_discord_avatar: avatarUrl,
          linked_discord_discriminator: discord_discriminator
        })
        .eq('user_id', user_id)
      
      if (updateError) {
        console.error('❌ Failed to link Discord account:', updateError)
        throw new Error('Failed to link Discord account to profile')
      }
      
      console.log('✅ Discord account linked successfully')
      
      return new Response(
        JSON.stringify({ success: true }),
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
    console.error('❌ Discord OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})