import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DeliveryCallback {
  type?: string;
  email?: string;
  admin_email?: string;
  status?: "success" | "failed";
  error_message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST is allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  let body: DeliveryCallback;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const { type = "unknown", email = "", admin_email = "", status = "failed", error_message } = body;

  try {
    await supabase.from("webhook_delivery_logs").insert({
      webhook_type: "email_status",
      webhook_url: "n8n-email-delivery-callback",
      status_code: status === "success" ? 200 : 500,
      success: status === "success",
      error_message: error_message || null,
      response_body: JSON.stringify(body),
      payload: { type, email, admin_email, status, error_message },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email delivery status recorded" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Failed to log email delivery status:", err.message);
    return new Response(
      JSON.stringify({ error: "Failed to log status", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
