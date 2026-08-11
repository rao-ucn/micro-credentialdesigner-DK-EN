import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting stale document cleanup...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate date 6 months ago
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const cutoffDate = sixMonthsAgo.toISOString()

    console.log(`Deleting incomplete documents older than: ${cutoffDate}`)

    // Delete incomplete documents that haven't been updated in 6 months
    const { data: deletedDocs, error, count } = await supabase
      .from('course_documents')
      .delete()
      .eq('is_complete', false)
      .lt('updated_at', cutoffDate)
      .select('document_id')

    if (error) {
      console.error('Error deleting stale documents:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const deletedCount = deletedDocs?.length || 0
    console.log(`Successfully deleted ${deletedCount} stale documents`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        deletedDocuments: deletedDocs?.map(d => d.document_id) || [],
        cutoffDate
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
