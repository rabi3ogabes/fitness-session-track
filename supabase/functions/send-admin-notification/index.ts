import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  type: 'signup' | 'booking' | 'session_request' | 'cancellation';
  userEmail: string;
  userName: string;
  details?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  trainerName?: string;
  cancellationDetails?: {
    className: string;
    classDate: string;
    classTime: string;
    currentEnrollment: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    console.log("Admin notification request received");
    
    const { type, userEmail, userName, details, className, classDate, classTime, trainerName, cancellationDetails }: AdminNotificationRequest = await req.json();
    
    if (!type || !userEmail || !userName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${type} notification for user: ${userName} (${userEmail})`);

    // Get admin notification settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Fetch admin notification settings
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/admin_notification_settings?select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    if (!settingsResponse.ok) {
      throw new Error(`Failed to fetch notification settings: ${settingsResponse.statusText}`);
    }

    const settings = await settingsResponse.json();
    
    if (!settings || settings.length === 0) {
      console.log("No admin notification settings found");
      return new Response(
        JSON.stringify({ message: "No notification settings configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminSettings = settings[0];
    
    // Check if this type of notification is enabled
    const notificationEnabled = type === 'signup' ? adminSettings.signup_notifications :
                               type === 'booking' ? adminSettings.booking_notifications :
                               type === 'cancellation' ? adminSettings.booking_notifications :
                               type === 'session_request' ? adminSettings.session_request_notifications :
                               false;
    
    if (!notificationEnabled) {
      console.log(`Notification type ${type} is disabled in settings`);
      return new Response(
        JSON.stringify({ message: `${type} notifications are disabled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare email content based on notification type
    let subject = '';
    let body = '';

    switch (type) {
      case 'signup':
        subject = `New Member Registration - ${userName}`;
        body = `
          <h2>New Member Registration</h2>
          <p>A new member has signed up for your gym!</p>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
          ${details ? `<p><strong>Additional Details:</strong> ${details}</p>` : ''}
          <p>Please review the new member's information and complete any necessary onboarding steps.</p>
        `;
        break;
        
      case 'booking':
        subject = `New Class Booking - ${userName}`;
        body = `
          <h2>New Class Booking</h2>
          <p>A member has booked a class!</p>
          <p><strong>Member:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Booking Time:</strong> ${new Date().toLocaleString()}</p>
          ${details ? `<p><strong>Class Details:</strong> ${details}</p>` : ''}
          <p>The class booking has been confirmed automatically.</p>
        `;
        break;
        
      case 'session_request':
        subject = `Session Balance Request - ${userName}`;
        body = `
          <h2>Session Balance Request</h2>
          <p>A member has requested additional sessions!</p>
          <p><strong>Member:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
          ${details ? `<p><strong>Request Details:</strong> ${details}</p>` : ''}
          <p>Please review and process this session balance request.</p>
        `;
        break;
        
      case 'cancellation':
        subject = `Class Booking Cancelled - ${cancellationDetails?.className || 'Unknown Class'}`;
        body = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">❌ Class Booking Cancelled</h2>
            <p>A member has cancelled their class booking.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0;">Member Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
              </ul>
            </div>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Class Details:</h3>
              <ul>
                <li><strong>Class:</strong> ${cancellationDetails?.className || 'Unknown Class'}</li>
                <li><strong>Date:</strong> ${cancellationDetails?.classDate ? new Date(cancellationDetails.classDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date'}</li>
                <li><strong>Time:</strong> ${cancellationDetails?.classTime || 'Unknown time'}</li>
                <li><strong>Current Enrollment:</strong> ${cancellationDetails?.currentEnrollment || 0} members</li>
                <li><strong>Cancellation Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>The member's session has been restored to their account balance.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system.
            </p>
          </div>
        `;
        break;
        
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Determine which webhook URL to use based on notification type
    let webhookUrl = null;
    
    switch (type) {
      case 'signup':
        webhookUrl = adminSettings.n8n_signup_webhook_url || adminSettings.n8n_webhook_url;
        break;
      case 'booking':
        webhookUrl = adminSettings.n8n_booking_webhook_url || adminSettings.n8n_webhook_url;
        break;
      case 'cancellation':
        webhookUrl = adminSettings.n8n_cancellation_webhook_url || adminSettings.n8n_webhook_url;
        break;
      case 'session_request':
        webhookUrl = adminSettings.n8n_session_request_webhook_url || adminSettings.n8n_webhook_url;
        break;
    }

    // Send to N8N webhook if configured
    if (webhookUrl) {
      console.log(`Sending ${type} notification to N8N webhook: ${webhookUrl}`);
      
      try {
        const n8nPayload = {
          type: type,
          user: {
            name: userName,
            email: userEmail
          },
          details: details,
          className: className,
          classDate: classDate,
          classTime: classTime,
          trainerName: trainerName,
          cancellationDetails: cancellationDetails,
          timestamp: new Date().toISOString()
        };

        const n8nResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(n8nPayload)
        });

        if (n8nResponse.ok) {
          console.log(`N8N ${type} webhook notification sent successfully`);
        } else {
          console.error(`N8N ${type} webhook failed:`, await n8nResponse.text());
        }
      } catch (error) {
        console.error(`Error sending ${type} notification to N8N webhook:`, error);
      }
    } else {
      console.log(`No N8N webhook configured for ${type} notifications`);
    }

    // Send email using the appropriate provider based on settings
    if (adminSettings.email_provider === 'resend') {
      // Use Resend for email sending
      const emailPayload = {
        userEmail: userEmail,
        userName: userName,
        notificationEmail: adminSettings.notification_email,
        subject: subject,
        body: body
      };

      console.log("Sending email notification via Resend...");
      
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });
    } else {
      // Use SMTP for email sending
      const emailPayload = {
        userEmail: userEmail,
        userName: userName,
        notificationEmail: adminSettings.notification_email,
        subject: subject,
        body: body,
        smtpSettings: {
          smtpHost: adminSettings.smtp_host,
          smtpPort: adminSettings.smtp_port.toString(),
          smtpUsername: adminSettings.smtp_username,
          smtpPassword: adminSettings.smtp_password,
          fromEmail: adminSettings.from_email,
          fromName: adminSettings.from_name,
          useSsl: adminSettings.smtp_use_tls || false
        }
      };

      console.log("Sending email notification via SMTP...");
      
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-smtp-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });
    }

    let emailResult;
    try {
      emailResult = await emailResponse.json();
    } catch (e) {
      emailResult = { error: "Failed to parse email response" };
    }

    // Log the notification attempt
    const logPayload = {
      notification_type: type,
      recipient_email: adminSettings.notification_email,
      subject: subject,
      status: emailResponse.ok ? 'sent' : 'failed',
      error_message: emailResponse.ok ? null : emailResult?.error || 'Unknown error',
      user_name: userName,
      user_email: userEmail
    };

    await fetch(`${supabaseUrl}/rest/v1/notification_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logPayload)
    });

    if (!emailResponse.ok) {
      console.error("Email sending failed:", emailResult);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email notification",
          details: emailResult?.error 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin notification sent successfully");
    
    return new Response(
      JSON.stringify({ 
        message: "Admin notification sent successfully",
        type: type
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-admin-notification function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);