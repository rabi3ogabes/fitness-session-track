import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("Testing notification processing...")

    // Get pending notifications
    const { data: pendingLogs, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${pendingLogs?.length || 0} pending notifications`)

    // Call the email function to process them
    const { data: processResult, error: processError } = await supabase.functions.invoke('send-email-notification', {
      body: { action: 'process_pending' }
    })

    if (processError) {
      console.error("Error processing:", processError)
      throw processError
    }

    // Check status after processing
    const { data: afterLogs, error: afterError } = await supabase
      .from('notification_logs')
      .select('id, status, error_message')
      .in('id', (pendingLogs || []).map(log => log.id))

    if (afterError) {
      throw afterError
    }

    return new Response(
      JSON.stringify({ 
        before: pendingLogs?.length || 0,
        after: afterLogs,
        processResult 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})