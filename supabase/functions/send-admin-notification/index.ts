import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name",
};

interface AdminNotificationRequest {
  type: 'signup' | 'login' | 'booking' | 'session_request' | 'cancellation';
  userEmail: string;
  userName: string;
  userId?: string;
  details?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  trainerName?: string;
  planName?: string;
  sessions?: number;
  price?: number;
  cancellationDetails?: {
    className: string;
    classDate: string;
    classTime: string;
    currentEnrollment: number;
  };
}

const labelFor = (t: string) => ({
  signup: 'New member signup',
  login: 'Member login',
  booking: 'New class booking',
  cancellation: 'Class booking cancelled',
  session_request: 'Session balance request',
} as Record<string, string>)[t] || 'New notification';

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const body: AdminNotificationRequest = await req.json();
    const { type, userEmail, userName, details, className, classDate, classTime, planName, sessions, price, cancellationDetails } = body;

    if (!type || !userEmail || !userName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fetch admin notification settings
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/admin_notification_settings?select=*`, {
      headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey, 'Content-Type': 'application/json' },
    });
    const settings = await settingsResponse.json();
    if (!settings?.length) {
      return new Response(JSON.stringify({ message: "No notification settings configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const adminSettings = settings[0];

    const enabled =
      type === 'signup' ? adminSettings.signup_notifications :
      type === 'login' ? (adminSettings.login_notifications ?? true) :
      type === 'booking' ? adminSettings.booking_notifications :
      type === 'cancellation' ? adminSettings.cancellation_notifications :
      type === 'session_request' ? adminSettings.session_request_notifications : false;

    if (!enabled) {
      return new Response(JSON.stringify({ message: `${type} notifications are disabled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subject = `${labelFor(type)} — ${userName}`;
    const adminEmail = adminSettings.notification_email;
    const ccEmail = adminSettings.notification_cc_email;

    // Build templateData passed to admin-notification React Email template
    const templateData: Record<string, any> = {
      eventType: type,
      memberName: userName,
      memberEmail: userEmail,
      details,
      className: className || cancellationDetails?.className,
      classDate: classDate || cancellationDetails?.classDate,
      classTime: classTime || cancellationDetails?.classTime,
      planName,
      sessions,
      price,
    };

    let emailSuccess = false;
    let errorMessage: string | null = null;

    if (adminEmail) {
      try {
        const recipients = [adminEmail, ...(ccEmail ? [ccEmail] : [])];
        for (const recipient of recipients) {
          const idempotencyKey = `admin-${type}-${recipient}-${Date.now()}`;
          const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateName: 'admin-notification',
              recipientEmail: recipient,
              idempotencyKey,
              templateData,
            }),
          });
          if (resp.ok) {
            emailSuccess = true;
          } else {
            errorMessage = `send-transactional-email ${resp.status}: ${await resp.text()}`;
            console.error(errorMessage);
          }
        }
      } catch (e) {
        errorMessage = e instanceof Error ? e.message : String(e);
        console.error('Email dispatch error:', errorMessage);
      }
    } else {
      errorMessage = 'No admin notification_email configured';
    }

    // Optional: also dispatch to n8n if configured (kept for back-compat)
    let webhookSuccess = false;
    let webhookUrl: string | null = null;
    switch (type) {
      case 'signup': webhookUrl = adminSettings.n8n_signup_webhook_url || adminSettings.n8n_webhook_url; break;
      case 'booking': webhookUrl = adminSettings.n8n_booking_webhook_url || adminSettings.n8n_webhook_url; break;
      case 'cancellation': webhookUrl = adminSettings.n8n_cancellation_webhook_url || adminSettings.n8n_webhook_url; break;
      case 'session_request': webhookUrl = adminSettings.n8n_session_request_webhook_url || adminSettings.n8n_webhook_url; break;
      case 'login': webhookUrl = adminSettings.n8n_webhook_url; break;
    }
    if (webhookUrl) {
      try {
        const r = await fetch(webhookUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, user: { name: userName, email: userEmail }, adminEmail, details, className, classDate, classTime, planName, sessions, price, cancellationDetails, timestamp: new Date().toISOString() }),
        });
        webhookSuccess = r.ok;
      } catch (err) { console.error('n8n dispatch error:', err); }
    }

    // Log to notification_logs
    try {
      await fetch(`${supabaseUrl}/rest/v1/notification_logs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_type: type,
          recipient_email: adminEmail,
          subject,
          status: (emailSuccess || webhookSuccess) ? 'sent' : 'failed',
          error_message: (!emailSuccess && !webhookSuccess) ? errorMessage : null,
          user_name: userName,
          user_email: userEmail,
        }),
      });
    } catch (logError) { console.error("Failed to log notification:", logError); }

    return new Response(
      JSON.stringify({ message: "Admin notification processed", type, emailSent: emailSuccess, webhookSent: webhookSuccess }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-admin-notification:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
