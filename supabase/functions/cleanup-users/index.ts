import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting user cleanup process...')

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users from auth
    const { data: allUsers, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📊 Found ${allUsers.users.length} total users`)

    // Find users to delete (all except contact@kickhelper.app)
    const usersToDelete = allUsers.users.filter(user => user.email !== 'contact@kickhelper.app')
    const preservedUser = allUsers.users.find(user => user.email === 'contact@kickhelper.app')

    console.log(`🎯 Preserving user: ${preservedUser?.email || 'NOT FOUND'}`)
    console.log(`🗑️ Deleting ${usersToDelete.length} users`)

    let deletedCount = 0
    let errors = []

    // Delete each user
    for (const user of usersToDelete) {
      try {
        console.log(`🗑️ Deleting user: ${user.email} (${user.id})`)
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`❌ Failed to delete user ${user.email}:`, deleteError)
          errors.push({ email: user.email, error: deleteError.message })
        } else {
          deletedCount++
          console.log(`✅ Successfully deleted user: ${user.email}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`❌ Exception deleting user ${user.email}:`, err)
        errors.push({ email: user.email, error: errorMessage })
      }
    }

    const result = {
      message: 'User cleanup completed',
      totalUsers: allUsers.users.length,
      deletedCount,
      preservedUser: preservedUser?.email || 'NOT FOUND',
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('🎉 Cleanup result:', result)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('🚨 Unexpected error during cleanup:', error)
    return new Response(JSON.stringify({ 
      error: 'Unexpected error during cleanup',
      details: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})