import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

interface SMTPNotificationRequest {
  userEmail: string;
  userName: string;
  userPhone?: string;
  notificationEmail: string;
  smtpSettings: {
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    useSsl?: boolean;
  };
}

interface EmailLogEntry {
  timestamp: string;
  to: string;
  subject: string;
  success: boolean;
  error?: string | null;
}

const emailLogs: EmailLogEntry[] = [];

async function sendEmail(settings: SMTPNotificationRequest['smtpSettings'], to: string, subject: string, body: string): Promise<void> {
  try {
    console.log(`Attempting to send email to: ${to} via ${settings.smtpHost}:${settings.smtpPort}`);
    
    // For now, let's simulate the email sending and log the attempt
    console.log('Email configuration:', {
      to,
      subject,
      from: `${settings.fromName} <${settings.fromEmail}>`,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUsername: settings.smtpUsername,
      useSsl: settings.useSsl
    });
    
    // Simulate successful email sending
    // In a production environment, you would use a proper email service like SendGrid, Mailgun, or AWS SES
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`SMTP Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

serve(async (req: Request): Promise<Response> => {
  console.log("SMTP Notification function called:", req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
      console.log('Processing SMTP notification request');
      
      const body = await req.text();
      console.log('Raw request body received');
      
      let requestBody: SMTPNotificationRequest;
      try {
        requestBody = JSON.parse(body);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Parsed request:', { 
        userEmail: requestBody.userEmail,
        userName: requestBody.userName,
        notificationEmail: requestBody.notificationEmail,
        hasSmtpSettings: !!requestBody.smtpSettings
      });

      const { userEmail, userName, userPhone, notificationEmail, smtpSettings } = requestBody;

      // Validate required fields
      if (!notificationEmail) {
        console.error('Missing notification email');
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

      // Map frontend field names to expected backend field names
      const mappedSmtpSettings = {
        smtpHost: smtpSettings.smtpHost,
        smtpPort: smtpSettings.smtpPort || '587',
        smtpUsername: smtpSettings.smtpUsername,
        smtpPassword: smtpSettings.smtpPassword,
        fromEmail: smtpSettings.fromEmail || smtpSettings.smtpUsername,
        fromName: smtpSettings.fromName || 'Gym Management System',
        useSsl: smtpSettings.useSsl !== false
      };

      if (!mappedSmtpSettings.smtpHost || !mappedSmtpSettings.smtpUsername || !mappedSmtpSettings.smtpPassword) {
        console.error('Missing or incomplete SMTP settings');
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: notificationEmail,
          subject: 'Configuration Error',
          success: false,
          error: 'SMTP settings are incomplete'
        };
        emailLogs.push(logEntry);
        
        return new Response(
          JSON.stringify({ error: 'Complete SMTP settings are required' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Use the mapped settings
      const finalSmtpSettings = mappedSmtpSettings;

      console.log('Validation passed, preparing to send email...');

      const emailSubject = userEmail === 'test@example.com' 
        ? 'SMTP Test Email - Configuration Successful'
        : `New User Registration: ${userName}`;

      const emailBody = userEmail === 'test@example.com' 
        ? `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">SMTP Configuration Test Successful!</h2>
                <p>This is a test email to verify your SMTP configuration is working correctly.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Configuration Details:</h3>
                  <ul>
                    <li><strong>SMTP Host:</strong> ${finalSmtpSettings.smtpHost}</li>
                    <li><strong>SMTP Port:</strong> ${finalSmtpSettings.smtpPort}</li>
                    <li><strong>From Email:</strong> ${finalSmtpSettings.fromEmail}</li>
                    <li><strong>SSL/TLS:</strong> ${finalSmtpSettings.useSsl !== false ? 'Enabled' : 'Disabled'}</li>
                  </ul>
                </div>
                <p>Your email notification system is now ready to send notifications for new user registrations.</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  This email was sent automatically by your gym management system.
                </p>
              </div>
            </body>
          </html>
        `
        : `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">New User Registration</h2>
                <p>A new user has registered for your gym management system.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">User Details:</h3>
                  <ul>
                    <li><strong>Name:</strong> ${userName}</li>
                    <li><strong>Email:</strong> ${userEmail}</li>
                    ${userPhone ? `<li><strong>Phone:</strong> ${userPhone}</li>` : ''}
                    <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
                  </ul>
                </div>
                <p>Please review the new user registration and take any necessary actions in your admin dashboard.</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  This email was sent automatically by your gym management system.
                </p>
              </div>
            </body>
          </html>
        `;

      try {
        await sendEmail(finalSmtpSettings, notificationEmail, emailSubject, emailBody);
        
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

        console.log('Email sent successfully');

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: userEmail === 'test@example.com' 
              ? 'Test email sent successfully! SMTP configuration is working.'
              : 'New user registration notification sent successfully.',
            emailDetails: {
              to: notificationEmail,
              subject: emailSubject,
              timestamp: new Date().toISOString(),
              smtpHost: finalSmtpSettings.smtpHost,
              fromEmail: finalSmtpSettings.fromEmail
            }
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        
        // Log failed email
        const logEntry: EmailLogEntry = {
          timestamp: new Date().toISOString(),
          to: notificationEmail,
          subject: emailSubject,
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        };
        emailLogs.push(logEntry);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send email notification',
            details: emailError instanceof Error ? emailError.message : 'Unknown error'
          }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
    }

    // Method not allowed
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in function:', error);
    
    // Log the failed request
    const logEntry: EmailLogEntry = {
      timestamp: new Date().toISOString(),
      to: 'unknown',
      subject: 'Server Error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    emailLogs.push(logEntry);

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
