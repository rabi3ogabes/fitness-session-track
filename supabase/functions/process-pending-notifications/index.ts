import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface NotificationLog {
  id: string;
  notification_type: string;
  user_email: string;
  user_name: string;
  recipient_email: string;
  subject: string;
  status: string;
  created_at: string;
}

const generateEmailContent = (log: NotificationLog): { subject: string; html: string } => {
  const baseSubject = `[Gym System] ${log.subject}`;
  
  switch (log.notification_type) {
    case 'signup':
      return {
        subject: baseSubject,
        html: `
          <h2>🎉 New Member Registration</h2>
          <p><strong>Name:</strong> ${log.user_name}</p>
          <p><strong>Email:</strong> ${log.user_email}</p>
          <p><strong>Registration Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
          <p>A new member has successfully registered for your gym.</p>
        `
      };
    case 'booking':
      return {
        subject: baseSubject,
        html: `
          <h2>📅 New Class Booking</h2>
          <p><strong>Member:</strong> ${log.user_name}</p>
          <p><strong>Email:</strong> ${log.user_email}</p>
          <p><strong>Booking Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
          <p>A member has booked a class at your gym.</p>
        `
      };
    case 'session_request':
      return {
        subject: baseSubject,
        html: `
          <h2>💪 New Session Request</h2>
          <p><strong>Member:</strong> ${log.user_name}</p>
          <p><strong>Email:</strong> ${log.user_email}</p>
          <p><strong>Request Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
          <p>A member has requested additional sessions.</p>
        `
      };
    default:
      return {
        subject: baseSubject,
        html: `
          <h2>📢 Gym Notification</h2>
          <p><strong>Member:</strong> ${log.user_name}</p>
          <p><strong>Email:</strong> ${log.user_email}</p>
          <p><strong>Date:</strong> ${new Date(log.created_at).toLocaleString()}</p>
        `
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== Processing pending notifications ===");

  try {
    // Fetch pending notifications
    const { data: pendingLogs, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error("Error fetching pending notifications:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingLogs?.length || 0} pending notifications`);

    if (!pendingLogs || pendingLogs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending notifications to process",
          processed: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each notification
    for (const log of pendingLogs) {
      console.log(`Processing notification ${log.id} of type ${log.notification_type}`);
      
      try {
        const { subject, html } = generateEmailContent(log);

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: "Gym System <notifications@fhb-fit.com>",
          to: [log.recipient_email],
          subject: subject,
          html: html,
        });

        console.log(`Email sent successfully for ${log.id}:`, emailResponse);

        // Update status to sent
        const { error: updateError } = await supabase
          .from('notification_logs')
          .update({ 
            status: 'sent',
            error_message: null
          })
          .eq('id', log.id);

        if (updateError) {
          console.error(`Error updating notification ${log.id}:`, updateError);
          errorCount++;
        } else {
          processedCount++;
        }

      } catch (emailError: any) {
        console.error(`Error sending email for ${log.id}:`, emailError);
        
        // Update status to error
        const { error: updateError } = await supabase
          .from('notification_logs')
          .update({ 
            status: 'error',
            error_message: emailError.message || 'Failed to send email'
          })
          .eq('id', log.id);

        if (updateError) {
          console.error(`Error updating notification ${log.id} with error status:`, updateError);
        }
        
        errorCount++;
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Processing complete. Sent: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        errors: errorCount,
        total: pendingLogs.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in process-pending-notifications function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);