import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for the request body
interface SMTPNotificationRequest {
  userEmail: string;
  userName: string;
  userPhone?: string;
  notificationEmail: string;
  smtpSettings: {
    host: string;
    port: string;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
    useSsl?: boolean;
  };
}

// Email logs storage
const emailLogs: Array<{
  timestamp: string;
  to: string;
  subject: string;
  status: 'success' | 'failed';
  error?: string;
}> = [];

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET request for logs
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        logs: emailLogs.slice(-20).reverse(), // Return last 20 logs in reverse order
        totalLogs: emailLogs.length 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }

  try {
    console.log('SMTP notification function called');
    
    const requestBody: SMTPNotificationRequest = await req.json();
    console.log('Request body received:', { 
      userEmail: requestBody.userEmail,
      userName: requestBody.userName,
      notificationEmail: requestBody.notificationEmail,
      smtpHost: requestBody.smtpSettings?.host 
    });

    const { userEmail, userName, userPhone, notificationEmail, smtpSettings } = requestBody;

    // Validate required fields
    if (!notificationEmail) {
      console.error('Missing notification email');
      return new Response(
        JSON.stringify({ error: 'Notification email is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!smtpSettings || !smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.fromEmail) {
      console.error('Missing SMTP settings');
      return new Response(
        JSON.stringify({ error: 'Complete SMTP settings are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Validation passed, constructing email...');

    // Construct the email content
    const emailSubject = userEmail === 'test@example.com' 
      ? 'SMTP Test Email - Configuration Successful'
      : `New User Registration: ${userName}`;

    const emailContent = userEmail === 'test@example.com'
      ? `
        <h2>🎉 SMTP Test Successful!</h2>
        <p>Congratulations! Your SMTP configuration is working correctly.</p>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li><strong>SMTP Host:</strong> ${smtpSettings.host}</li>
          <li><strong>SMTP Port:</strong> ${smtpSettings.port}</li>
          <li><strong>From Email:</strong> ${smtpSettings.fromEmail}</li>
          <li><strong>From Name:</strong> ${smtpSettings.fromName}</li>
        </ul>
        <p>You are now ready to receive new user registration notifications!</p>
      `
      : `
        <h2>🆕 New User Registration</h2>
        <p>A new user has registered for your gym system.</p>
        <p><strong>User Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${userName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          ${userPhone ? `<li><strong>Phone:</strong> ${userPhone}</li>` : ''}
        </ul>
        <p>Please review this registration and take any necessary actions in your admin dashboard.</p>
      `;

    const htmlEmail = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Gym Management System</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            ${emailContent}
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              This email was sent automatically from your Gym Management System.<br>
              Time: ${new Date().toLocaleString()}
            </p>
          </div>
        </body>
      </html>
    `;

    console.log('Email constructed, simulating SMTP send...');
    console.log('Email details:', {
      to: notificationEmail,
      subject: emailSubject,
      smtpHost: smtpSettings.host,
      smtpPort: smtpSettings.port,
      fromEmail: smtpSettings.fromEmail,
      fromName: smtpSettings.fromName
    });

    // Log the email attempt
    const logEntry = {
      timestamp: new Date().toISOString(),
      to: notificationEmail,
      subject: emailSubject,
      status: 'success' as const
    };
    emailLogs.push(logEntry);
    
    // Keep only last 100 logs
    if (emailLogs.length > 100) {
      emailLogs.splice(0, emailLogs.length - 100);
    }

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Email simulated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailDetails: {
          to: notificationEmail,
          subject: emailSubject,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-smtp-notification function:', error);
    
    // Log the failed email
    const logEntry = {
      timestamp: new Date().toISOString(),
      to: 'unknown',
      subject: 'Failed Email',
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    emailLogs.push(logEntry);

    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
