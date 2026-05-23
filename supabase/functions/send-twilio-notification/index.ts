import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

interface TwilioRequest {
  to: string;            // recipient E.164 e.g. +14155551234
  message: string;       // body
  channel?: "sms" | "whatsapp";
  from?: string;         // sender number (E.164 or whatsapp:+...)
}

function formatNumber(num: string, channel: string): string {
  if (!num) return num;
  const cleaned = num.trim();
  if (channel === "whatsapp") {
    return cleaned.startsWith("whatsapp:") ? cleaned : `whatsapp:${cleaned}`;
  }
  return cleaned.replace(/^whatsapp:/, "");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, message, channel = "whatsapp", from }: TwilioRequest = await req.json();

    if (!to || !message || !from) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message, from" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured (connect Twilio in Lovable)");

    const body = new URLSearchParams({
      To: formatNumber(to, channel),
      From: formatNumber(from, channel),
      Body: message,
    });

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Twilio error [${response.status}]:`, data);
      return new Response(
        JSON.stringify({ success: false, status: response.status, error: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, sid: data.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("send-twilio-notification error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

serve(handler);
