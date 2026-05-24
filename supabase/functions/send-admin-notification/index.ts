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
  bookedByAdmin?: boolean;
}


const adminLabel = (t: string) => ({
  signup: 'New member signup',
  login: 'Member login',
  booking: 'New class booking',
  cancellation: 'Class booking cancelled',
  session_request: 'Session balance request',
} as Record<string, string>)[t] || 'New notification';

async function logNotification(
  supabaseUrl: string, supabaseKey: string,
  row: Record<string, any>,
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/notification_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });
  } catch (e) { console.error('log fail', e); }
}

async function sendLovableEmail(
  supabaseUrl: string, supabaseKey: string,
  templateName: string, recipient: string,
  templateData: Record<string, any>, idempotencyKey: string,
) {
  const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateName, recipientEmail: recipient, idempotencyKey, templateData }),
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, body: text };
}

async function sendN8n(url: string, payload: Record<string, any>) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { ok: r.ok, status: r.status, body: await r.text().catch(() => '') };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const body: AdminNotificationRequest = await req.json();
    const { type, userEmail, userName, details, className, classDate, classTime, trainerName, planName, sessions, price, bookedByAdmin } = body;

    if (!type || !userEmail || !userName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const settingsResp = await fetch(`${supabaseUrl}/rest/v1/admin_notification_settings?select=*&limit=1`, {
      headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey, 'Content-Type': 'application/json' },
    });
    const settings = await settingsResp.json();
    if (!settings?.length) {
      return new Response(JSON.stringify({ message: "No notification settings configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const s = settings[0];

    const adminEnabled =
      type === 'signup' ? s.signup_notifications :
      type === 'login' ? (s.login_notifications ?? true) :
      type === 'booking' ? s.booking_notifications :
      type === 'cancellation' ? s.cancellation_notifications :
      type === 'session_request' ? s.session_request_notifications : false;

    const memberEnabled =
      type === 'signup' ? (s.notify_member_welcome ?? true) :
      type === 'booking' ? (s.notify_member_booking ?? true) :
      type === 'cancellation' ? (s.notify_member_cancellation ?? true) :
      type === 'session_request' ? (s.notify_member_session_request ?? true) : false;

    const provider: 'lovable_email' | 'n8n' = (s.active_provider === 'n8n') ? 'n8n' : 'lovable_email';
    const adminEmail = s.notification_email;
    const ccEmail = s.notification_cc_email;

    const results: any[] = [];

    // Lookup the member phone so the admin email can offer a WhatsApp link.
    let memberPhone: string | null = null;
    try {
      const phoneResp = await fetch(
        `${supabaseUrl}/rest/v1/members?select=phone&email=eq.${encodeURIComponent(userEmail)}&limit=1`,
        { headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey } }
      );
      const phoneRows = await phoneResp.json();
      memberPhone = phoneRows?.[0]?.phone || null;
    } catch (e) { console.error('phone lookup failed', e); }

    const templateData = {
      eventType: type, memberName: userName, memberEmail: userEmail, memberPhone,
      details, className, classDate, classTime, trainerName, planName, sessions, price,
      bookedByAdmin: !!bookedByAdmin,
    };


    // ----- Admin alert -----
    if (adminEnabled && adminEmail) {
      const recipients = [adminEmail, ...(ccEmail ? [ccEmail] : [])];
      for (const recipient of recipients) {
        if (provider === 'lovable_email') {
          const r = await sendLovableEmail(
            supabaseUrl, supabaseKey,
            'admin-notification', recipient, templateData,
            `admin-${type}-${recipient}-${Date.now()}`,
          );
          await logNotification(supabaseUrl, supabaseKey, {
            notification_type: type, recipient_email: recipient,
            subject: adminLabel(type), user_name: userName, user_email: userEmail,
            status: r.ok ? 'sent' : 'failed',
            error_message: r.ok ? null : `lovable_email ${r.status}: ${r.body}`,
          });
          results.push({ kind: 'admin', via: 'lovable_email', recipient, ok: r.ok });
        } else {
          let webhookUrl: string | null = null;
          switch (type) {
            case 'signup': webhookUrl = s.n8n_signup_webhook_url || s.n8n_webhook_url; break;
            case 'booking': webhookUrl = s.n8n_booking_webhook_url || s.n8n_webhook_url; break;
            case 'cancellation': webhookUrl = s.n8n_cancellation_webhook_url || s.n8n_webhook_url; break;
            case 'session_request': webhookUrl = s.n8n_session_request_webhook_url || s.n8n_webhook_url; break;
            case 'login': webhookUrl = s.n8n_webhook_url; break;
          }
          if (webhookUrl) {
            const r = await sendN8n(webhookUrl, {
              kind: 'admin', type, recipient, adminEmail, ccEmail,
              user: { name: userName, email: userEmail },
              details, className, classDate, classTime, trainerName, planName, sessions, price,
              timestamp: new Date().toISOString(),
            });
            await logNotification(supabaseUrl, supabaseKey, {
              notification_type: type, recipient_email: recipient,
              subject: adminLabel(type), user_name: userName, user_email: userEmail,
              status: r.ok ? 'sent' : 'failed',
              error_message: r.ok ? null : `n8n ${r.status}: ${r.body}`,
            });
            results.push({ kind: 'admin', via: 'n8n', recipient, ok: r.ok });
          } else {
            await logNotification(supabaseUrl, supabaseKey, {
              notification_type: type, recipient_email: recipient,
              subject: adminLabel(type), user_name: userName, user_email: userEmail,
              status: 'failed', error_message: 'No n8n webhook URL configured for this event',
            });
          }
        }
      }
    }

    // ----- Member email (only via Lovable Email; n8n handles its own member flow) -----
    if (memberEnabled && userEmail && provider === 'lovable_email' && type !== 'login') {
      const r = await sendLovableEmail(
        supabaseUrl, supabaseKey,
        type === 'signup' ? 'member-welcome' : 'member-notification',
        userEmail, templateData,
        `member-${type}-${userEmail}-${Date.now()}`,
      );
      await logNotification(supabaseUrl, supabaseKey, {
        notification_type: `member_${type}`, recipient_email: userEmail,
        subject: type === 'signup' ? 'Welcome' : adminLabel(type),
        user_name: userName, user_email: userEmail,
        status: r.ok ? 'sent' : 'failed',
        error_message: r.ok ? null : `lovable_email ${r.status}: ${r.body}`,
      });
      results.push({ kind: 'member', via: 'lovable_email', recipient: userEmail, ok: r.ok });
    }

    return new Response(
      JSON.stringify({ message: "Admin notification processed", provider, type, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-admin-notification:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
