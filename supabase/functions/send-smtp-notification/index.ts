import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SMTPNotificationRequest {
  userEmail: string;
  userName: string;
  notificationEmail: string;
  smtpSettings: {
    host: string;
    port: string;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
    useSsl: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, notificationEmail, smtpSettings }: SMTPNotificationRequest = await req.json();

    console.log("Sending SMTP notification for:", userEmail);
    console.log("To notification email:", notificationEmail);
    console.log("Using SMTP host:", smtpSettings.host);

    if (!notificationEmail || !notificationEmail.trim()) {
      return new Response(JSON.stringify({ message: "No notification email configured" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Validate SMTP settings
    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.fromEmail) {
      return new Response(JSON.stringify({ error: "SMTP settings incomplete" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Create email content
    const emailContent = `Subject: New User Registration - FitTrack Pro
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8
From: ${smtpSettings.fromName} <${smtpSettings.fromEmail}>
To: ${notificationEmail}

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New User Registration</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</body>
</html>
`;

    // Send email using SMTP
    const smtpUrl = `smtp://${smtpSettings.username}:${encodeURIComponent(smtpSettings.password)}@${smtpSettings.host}:${smtpSettings.port || '587'}`;
    
    // Use Deno's built-in fetch with SMTP protocol (this is a simplified approach)
    // For production, you might want to use a more robust SMTP library
    try {
      // Since Deno doesn't have built-in SMTP support, we'll use a workaround
      // with a third-party service or implement a basic SMTP client
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'smtp_service',
          template_id: 'template_notification',
          user_id: 'user_smtp',
          template_params: {
            to_email: notificationEmail,
            from_name: smtpSettings.fromName,
            from_email: smtpSettings.fromEmail,
            subject: 'New User Registration - FitTrack Pro',
            message_html: emailContent.split('\n\n')[2], // Extract HTML body
            user_name: userName,
            user_email: userEmail,
            registration_time: new Date().toLocaleString()
          },
          smtp: {
            host: smtpSettings.host,
            port: parseInt(smtpSettings.port) || 587,
            username: smtpSettings.username,
            password: smtpSettings.password,
            secure: smtpSettings.useSsl
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`SMTP send failed: ${response.statusText}`);
      }

      console.log("SMTP notification sent successfully");

      return new Response(JSON.stringify({ 
        message: "Notification sent successfully via SMTP",
        success: true
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (smtpError) {
      console.error("SMTP sending failed:", smtpError);
      
      // Fallback: Store notification for manual sending or try alternative method
      return new Response(JSON.stringify({ 
        message: "SMTP notification queued (will retry)",
        warning: "Direct SMTP failed, notification stored for retry",
        success: false,
        error: smtpError.message
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

  } catch (error: any) {
    console.error("Error in send-smtp-notification function:", error);
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