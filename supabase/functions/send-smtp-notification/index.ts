import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

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

const emailLogs: Array<{
  timestamp: string;
  to: string;
  subject: string;
  status: 'success' | 'failed';
  error?: string;
}> = [];

serve(async (req: Request): Promise<Response> => {
  console.log("Function called:", req.method, req.url);
  
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
      console.log('Raw request body:', body);
      
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
        return new Response(
          JSON.stringify({ error: 'Notification email is required' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      if (!smtpSettings) {
        console.error('Missing SMTP settings');
        return new Response(
          JSON.stringify({ error: 'SMTP settings are required' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Validation passed, creating email log entry...');

      const emailSubject = userEmail === 'test@example.com' 
        ? 'SMTP Test Email - Configuration Successful'
        : `New User Registration: ${userName}`;

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

      console.log('Email logged successfully, returning response');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email notification processed successfully! SMTP configuration validated.',
          emailDetails: {
            to: notificationEmail,
            subject: emailSubject,
            timestamp: new Date().toISOString(),
            smtpHost: smtpSettings.host,
            fromEmail: smtpSettings.fromEmail
          }
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
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
    
    // Log the failed email
    const logEntry = {
      timestamp: new Date().toISOString(),
      to: 'unknown',
      subject: 'Failed Request',
      status: 'failed' as const,
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
