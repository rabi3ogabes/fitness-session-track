import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

console.log("Resend API Key configured:", !!Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface EmailNotificationRequest {
  userEmail: string;
  userName: string;
  userPhone?: string;
  notificationEmail: string;
  fromEmail?: string;
  fromName?: string;
}

interface EmailLogEntry {
  timestamp: string;
  to: string;
  subject: string;
  success: boolean;
  error?: string | null;
}

const emailLogs: EmailLogEntry[] = [];

const handler = async (req: Request): Promise<Response> => {
  console.log("=== Email notification function called ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle GET request for logs
    if (req.method === 'GET') {
      console.log("Returning email logs, count:", emailLogs.length);
      return new Response(
        JSON.stringify({ 
          logs: emailLogs.slice(-20).reverse(),
          totalLogs: emailLogs.length 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Handle POST request for sending emails
    if (req.method === 'POST') {
      console.log("Processing POST request for email sending");
      
      let requestBody;
      try {
        requestBody = await req.json();
        console.log("Request body received:", requestBody);
      } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const { userEmail, userName, userPhone, notificationEmail, fromEmail, fromName }: EmailNotificationRequest = requestBody;

      // Validate required fields
      if (!notificationEmail) {
        console.error("Validation failed: notificationEmail is required");
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: 'unknown',
          subject: 'Validation Failed',
          success: false,
          error: 'Notification email is required'
        };
        emailLogs.push(logEntry);
        
        return new Response(
          JSON.stringify({ error: 'Notification email is required' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const isTestEmail = userEmail === 'test@example.com';
      const emailSubject = isTestEmail 
        ? 'Email Test - Configuration Successful'
        : `New User Registration: ${userName}`;

      const emailBody = isTestEmail 
        ? `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">✅ Email Configuration Test Successful!</h2>
            <p>Congratulations! Your email notification system is working correctly.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Test Details:</h3>
              <ul>
                <li><strong>Service:</strong> Resend Email API</li>
                <li><strong>Notification Email:</strong> ${notificationEmail}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>Your gym management system is now ready to send email notifications for:</p>
            <ul>
              <li>New member registrations</li>
              <li>Class bookings</li>
              <li>Session balance requests</li>
            </ul>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system using Resend.
            </p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">🎉 New User Registration</h2>
            <p>A new member has registered for your gym management system.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Member Details:</h3>
              <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                ${userPhone ? `<li><strong>Phone:</strong> ${userPhone}</li>` : ''}
                <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>Please review the new member registration and take any necessary actions in your admin dashboard.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email was sent automatically by your gym management system.
            </p>
          </div>
        `;

      try {
        console.log(`Attempting to send email to: ${notificationEmail}`);
        console.log(`From: ${fromEmail && fromName ? `${fromName} <${fromEmail}>` : "Gym Management <onboarding@resend.dev>"}`);
        console.log(`Subject: ${emailSubject}`);
        
        const emailResponse = await resend.emails.send({
          from: fromEmail && fromName ? `${fromName} <${fromEmail}>` : "Gym Management <onboarding@resend.dev>",
          to: [notificationEmail],
          subject: emailSubject,
          html: emailBody,
        });

        console.log("Email sent successfully:", emailResponse);

        // Log successful email
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: notificationEmail,
          subject: emailSubject,
          success: true,
          error: null
        };
        emailLogs.push(logEntry);
        
        // Keep only last 100 logs
        if (emailLogs.length > 100) {
          emailLogs.splice(0, emailLogs.length - 100);
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: isTestEmail 
              ? 'Test email sent successfully! Email notifications are working.'
              : 'New user registration notification sent successfully.',
            emailDetails: {
              id: emailResponse.data?.id,
              to: notificationEmail,
              subject: emailSubject,
              timestamp: new Date().toISOString()
            }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        
        // Log failed email
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: notificationEmail,
          subject: emailSubject,
          success: false,
          error: emailError.message || 'Unknown error'
        };
        emailLogs.push(logEntry);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to send email notification",
            details: emailError.message || 'Unknown error'
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Method not allowed
    console.log(`Method ${req.method} not allowed`);
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("=== UNEXPECTED ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Log the failed request
    const logEntry: EmailLogEntry = {
      timestamp: new Date().toISOString(),
      to: 'unknown',
      subject: 'Server Error',
      success: false,
      error: error.message || 'Unknown error'
    };
    emailLogs.push(logEntry);

    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
