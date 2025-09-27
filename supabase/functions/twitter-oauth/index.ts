import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwitterOAuthRequest {
  action: 'initiate' | 'callback'
  code?: string
  state?: string
}

interface TwitterUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { action, code, state }: TwitterOAuthRequest = await req.json()
    console.log('🐦 Twitter OAuth request:', { action, hasCode: !!code, state })

    const TWITTER_CLIENT_ID = Deno.env.get('TWITTER_CLIENT_ID')?.trim()
    const TWITTER_CLIENT_SECRET = Deno.env.get('TWITTER_CLIENT_SECRET')?.trim()

    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
      console.error('❌ Missing Twitter API credentials')
      return new Response(
        JSON.stringify({ error: 'Twitter API not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'initiate') {
      // Generate OAuth URL for Twitter/X
      // Get the correct app origin from the request body or use a hardcoded value
      // First try to get from referer, then origin, then fall back to current preview URL
      const refererUrl = req.headers.get('referer') || ''
      const originUrl = req.headers.get('origin') || ''
      
      // Extract the correct origin - prioritize kickhelper.app, then lovableproject.com
      let appOrigin = '';
      if (refererUrl && refererUrl.includes('kickhelper.app')) {
        appOrigin = new URL(refererUrl).origin;
      } else if (originUrl && originUrl.includes('kickhelper.app')) {
        appOrigin = originUrl;
      } else if (refererUrl && refererUrl.includes('lovableproject.com')) {
        appOrigin = new URL(refererUrl).origin;
      } else if (originUrl && originUrl.includes('lovableproject.com')) {
        appOrigin = originUrl;
      } else {
        // Fallback to the current known working URL
        appOrigin = 'https://7c92ba76-0c21-4cc0-8512-993c19e87036.lovableproject.com';
      }
      
      const redirectUri = `${appOrigin}/twitter-callback`
      const authState = crypto.randomUUID()
      
      console.log('🔧 Referer:', refererUrl)
      console.log('🔧 Origin:', originUrl)
      console.log('🔧 Using app origin:', appOrigin)
      console.log('🔧 Final redirect URI:', redirectUri)
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'tweet.read users.read',
        state: authState,
        code_challenge: 'challenge',
        code_challenge_method: 'plain'
      })

      const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`
      
      console.log('✅ Generated Twitter OAuth URL')
      return new Response(
        JSON.stringify({ authUrl, state: authState }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'callback' && code) {
      try {
        console.log('🔄 Processing Twitter OAuth callback...')
        
        // Exchange code for access token
        // Get the correct app origin - same logic as initiate
        const refererUrl = req.headers.get('referer') || ''
        const originUrl = req.headers.get('origin') || ''
        
        let appOrigin = '';
        if (refererUrl && refererUrl.includes('kickhelper.app')) {
          appOrigin = new URL(refererUrl).origin;
        } else if (originUrl && originUrl.includes('kickhelper.app')) {
          appOrigin = originUrl;
        } else if (refererUrl && refererUrl.includes('lovableproject.com')) {
          appOrigin = new URL(refererUrl).origin;
        } else if (originUrl && originUrl.includes('lovableproject.com')) {
          appOrigin = originUrl;
        } else {
          // Fallback to the current known working URL
          appOrigin = 'https://7c92ba76-0c21-4cc0-8512-993c19e87036.lovableproject.com';
        }
        
        const redirectUri = `${appOrigin}/twitter-callback`
        
        console.log('🔧 Token exchange - using redirect URI:', redirectUri)
        const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)}`
          },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: TWITTER_CLIENT_ID,
            redirect_uri: redirectUri,
            code_verifier: 'challenge'
          })
        })

        if (!tokenResponse.ok) {
          const tokenError = await tokenResponse.text()
          console.error('❌ Token exchange failed:', tokenError)
          throw new Error(`Token exchange failed: ${tokenError}`)
        }

        const tokenData = await tokenResponse.json()
        console.log('✅ Twitter access token obtained')

        // Get user info from Twitter
        const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        })

        if (!userResponse.ok) {
          const userError = await userResponse.text()
          console.error('❌ Failed to get Twitter user info:', userError)
          throw new Error(`Failed to get user info: ${userError}`)
        }

        const userData = await userResponse.json()
        const twitterUser: TwitterUser = userData.data
        console.log('✅ Twitter user data retrieved:', twitterUser.username)

        // Update user profile with Twitter info
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            linked_twitter_user_id: twitterUser.id,
            linked_twitter_username: twitterUser.username,
            linked_twitter_display_name: twitterUser.name,
            linked_twitter_avatar: twitterUser.profile_image_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('❌ Failed to update profile with Twitter data:', updateError)
          throw updateError
        }

        console.log('✅ Profile updated with Twitter data')

        return new Response(
          JSON.stringify({ 
            success: true, 
            twitterUser: {
              id: twitterUser.id,
              username: twitterUser.username,
              displayName: twitterUser.name,
              avatar: twitterUser.profile_image_url
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } catch (error) {
        console.error('❌ Twitter OAuth callback error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to link Twitter account' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Twitter OAuth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})