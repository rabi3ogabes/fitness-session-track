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

    // For demonstration purposes, we'll simulate email sending
    // In a real implementation, you would integrate with an SMTP library
    console.log("SMTP Configuration:", {
      host: smtpSettings.host,
      port: smtpSettings.port,
      username: smtpSettings.username,
      fromEmail: smtpSettings.fromEmail,
      fromName: smtpSettings.fromName,
      useSsl: smtpSettings.useSsl
    });

    console.log("Email Content:", emailContent);

    try {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, we'll just log the email content and return success
      // In production, you would integrate with a proper SMTP client library
      console.log("Email would be sent to:", notificationEmail);
      console.log("Subject: New User Registration - FitTrack Pro");
      console.log("From:", `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`);
      
      return new Response(JSON.stringify({ 
        message: "Test email sent successfully (simulated)",
        success: true,
        details: {
          to: notificationEmail,
          from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
          subject: "New User Registration - FitTrack Pro",
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (error) {
      console.error("Email sending failed:", error);
      
      return new Response(JSON.stringify({ 
        message: "Failed to send email",
        success: false,
        error: error.message
      }), {
        status: 500,
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