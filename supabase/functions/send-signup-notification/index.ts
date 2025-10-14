
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.1.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignupNotificationRequest {
  userEmail: string;
  userName: string;
  notificationEmails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, notificationEmails }: SignupNotificationRequest = await req.json();

    console.log("Sending signup notification for:", userEmail);
    console.log("Notification emails:", notificationEmails);
    
    // Check if Resend is enabled in admin settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/admin_notification_settings?select=resend_enabled`, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          if (settings && settings.length > 0 && !settings[0].resend_enabled) {
            console.log("Resend notifications are disabled, skipping signup notification");
            return new Response(JSON.stringify({ message: "Resend notifications are disabled" }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error checking Resend settings:", error);
      }
    }

    // Filter out empty emails
    const validEmails = notificationEmails.filter(email => email && email.trim() !== "");
    
    if (validEmails.length === 0) {
      console.log("No valid notification emails found");
      return new Response(JSON.stringify({ message: "No notification emails configured" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Send email to each notification email
    const emailPromises = validEmails.map(email =>
      resend.emails.send({
        from: "FitTrack Pro <onboarding@resend.dev>",
        to: [email],
        subject: "New User Registration - FitTrack Pro",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New User Registration</h2>
            <p>A new user has signed up for FitTrack Pro:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Name:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>You can manage this user from the Admin Dashboard.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated notification from FitTrack Pro.
            </p>
          </div>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failureCount = results.filter(result => result.status === 'rejected').length;

    console.log(`Email notifications sent: ${successCount} successful, ${failureCount} failed`);

    if (failureCount > 0) {
      const failures = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);
      console.error("Failed email notifications:", failures);
    }

    return new Response(JSON.stringify({ 
      message: `Notifications sent to ${successCount} recipients`,
      successCount,
      failureCount
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-signup-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
