import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwitterAPIRequest {
  action: 'get-tweets' | 'analyze-tweet' | 'verify-participant' | 'get-engagement';
  tweet_id?: string;
  twitter_user_id?: string;
  giveaway_id?: string;
  conditions?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('✅ User authenticated:', user.id);

    const body: TwitterAPIRequest = await req.json();
    console.log('🐦 Twitter API request:', { action: body.action });

    // Get Twitter credentials from secrets
    const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN');
    if (!TWITTER_BEARER_TOKEN) {
      throw new Error('Twitter Bearer Token not configured');
    }

    // Get user's Twitter account from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('linked_twitter_user_id, linked_twitter_username')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.linked_twitter_user_id) {
      throw new Error('Twitter account not linked');
    }

    const twitterUserId = profile.linked_twitter_user_id;
    console.log('🔗 Twitter user ID:', twitterUserId);

    switch (body.action) {
      case 'get-tweets': {
        // Get user's recent tweets
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${twitterUserId}/tweets?max_results=10&tweet.fields=created_at,public_metrics,context_annotations`,
          {
            headers: {
              'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
          }
        );

        if (!tweetsResponse.ok) {
          throw new Error(`Twitter API error: ${tweetsResponse.status}`);
        }

        const tweetsData = await tweetsResponse.json();
        console.log('📜 Retrieved tweets:', tweetsData.data?.length || 0);

        return new Response(JSON.stringify({
          success: true,
          tweets: tweetsData.data || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze-tweet': {
        if (!body.tweet_id) {
          throw new Error('Tweet ID required');
        }

        // Get tweet details
        const tweetResponse = await fetch(
          `https://api.twitter.com/2/tweets/${body.tweet_id}?expansions=author_id&tweet.fields=created_at,public_metrics&user.fields=username`,
          {
            headers: {
              'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
          }
        );

        if (!tweetResponse.ok) {
          throw new Error(`Twitter API error: ${tweetResponse.status}`);
        }

        const tweetData = await tweetResponse.json();
        
        // Get retweets
        const retweetsResponse = await fetch(
          `https://api.twitter.com/2/tweets/${body.tweet_id}/retweeted_by?max_results=100&user.fields=username,profile_image_url,created_at`,
          {
            headers: {
              'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
          }
        );

        // Get likes
        const likesResponse = await fetch(
          `https://api.twitter.com/2/tweets/${body.tweet_id}/liking_users?max_results=100&user.fields=username,profile_image_url,created_at`,
          {
            headers: {
              'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
          }
        );

        const retweetsData = retweetsResponse.ok ? await retweetsResponse.json() : { data: [] };
        const likesData = likesResponse.ok ? await likesResponse.json() : { data: [] };

        console.log('📊 Tweet analysis:', {
          retweets: retweetsData.data?.length || 0,
          likes: likesData.data?.length || 0,
        });

        return new Response(JSON.stringify({
          success: true,
          tweet: tweetData.data,
          retweets: retweetsData.data || [],
          likes: likesData.data || [],
          metrics: tweetData.data?.public_metrics || {},
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify-participant': {
        if (!body.twitter_user_id || !body.conditions) {
          throw new Error('Twitter user ID and conditions required');
        }

        const conditions = body.conditions;
        const participantId = body.twitter_user_id;
        const conditionsMet: any = {};

        // Check if user is following (if required)
        if (conditions.follow_required) {
          const followResponse = await fetch(
            `https://api.twitter.com/2/users/${participantId}/following/${twitterUserId}`,
            {
              headers: {
                'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
              },
            }
          );
          conditionsMet.following = followResponse.ok;
        }

        // For retweets and likes, this would be checked during tweet analysis
        // since we already have that data

        console.log('✅ Participant verification:', { participantId, conditionsMet });

        return new Response(JSON.stringify({
          success: true,
          conditions_met: conditionsMet,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-engagement': {
        if (!body.twitter_user_id) {
          throw new Error('Twitter user ID required');
        }

        // Get user details
        const userResponse = await fetch(
          `https://api.twitter.com/2/users/${body.twitter_user_id}?user.fields=created_at,public_metrics,profile_image_url`,
          {
            headers: {
              'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
          }
        );

        if (!userResponse.ok) {
          throw new Error(`Twitter API error: ${userResponse.status}`);
        }

        const userData = await userResponse.json();

        return new Response(JSON.stringify({
          success: true,
          user: userData.data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('❌ Twitter API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});