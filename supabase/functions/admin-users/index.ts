import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Admin function called:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('No authorization header found')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    console.log('Verifying user authentication...')
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message || 'No user')
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User authenticated:', user.id)

    // Check if user has admin role
    console.log('Checking admin role for user:', user.id)
    const { data: hasAdminRole, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    console.log('Admin role check result:', { hasAdminRole, roleError })
    if (roleError || !hasAdminRole) {
      console.log('Admin access denied:', roleError?.message || 'User is not admin')
      return new Response(
        JSON.stringify({ error: 'Admin access required', details: roleError?.message }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || (req.method === 'GET' ? 'list-users' : null)

    if (req.method === 'GET' || action === 'list-users') {
      // Get all auth users using admin client
      const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authUsersError) {
        throw authUsersError
      }

      // Get profiles for all users
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, display_name, kick_username, kick_user_id, created_at')

      if (profilesError) {
        throw profilesError
      }

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) {
        throw rolesError
      }

      // Combine the data
      const users = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.user_id === authUser.id)
        const roleData = userRoles?.find(r => r.user_id === authUser.id)
        
        return {
          id: authUser.id,
          email: authUser.email || '',
          display_name: profile?.display_name,
          kick_username: profile?.kick_username,
          kick_user_id: profile?.kick_user_id,
          role: roleData?.role || 'user',
          created_at: authUser.created_at
        }
      })

      return new Response(
        JSON.stringify({ users }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { action, userId, role } = body
      
      if (action === 'update-role') {
        if (!userId || !role) {
          return new Response(
            JSON.stringify({ error: 'Missing userId or role' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Delete existing roles for user
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId)

        // Insert new role
        const { error: updateError } = await supabaseAdmin
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: role,
            granted_by: user.id 
          })

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or method' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Admin function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})