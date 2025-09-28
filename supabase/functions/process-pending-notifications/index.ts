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
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("Processing pending notifications manually...")

    // Get pending notifications
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error("Error fetching pending notifications:", fetchError)
      throw fetchError
    }

    console.log(`Found ${pendingNotifications?.length || 0} pending notifications`)

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications to process' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process each notification by calling the email function
    let processedCount = 0
    for (const notification of pendingNotifications) {
      try {
        console.log(`Processing notification ${notification.id} of type ${notification.notification_type}`)
        
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-notification', {
          body: { action: 'process_pending' }
        })

        if (emailError) {
          console.error(`Error processing notification ${notification.id}:`, emailError)
          // Mark as failed
          await supabase
            .from('notification_logs')
            .update({ 
              status: 'failed',
              error_message: emailError.message || 'Processing failed'
            })
            .eq('id', notification.id)
        } else {
          console.log(`Successfully processed notification ${notification.id}`)
          processedCount++
        }
      } catch (err) {
        console.error(`Exception processing notification ${notification.id}:`, err)
        await supabase
          .from('notification_logs')
          .update({ 
            status: 'failed',
            error_message: 'Exception during processing'
          })
          .eq('id', notification.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${processedCount} of ${pendingNotifications.length} pending notifications`,
        processed: processedCount,
        total: pendingNotifications.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error in process-pending-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})