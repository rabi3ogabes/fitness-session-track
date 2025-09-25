import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookRequest {
  integrations: Array<{
    id: string;
    name: string;
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    enabled: boolean;
    events: string[];
  }>;
  eventType: string;
  eventData: any;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      integrations, 
      eventType, 
      eventData,
      retryConfig = { maxRetries: 3, retryDelay: 5 }
    }: WebhookRequest = await req.json();

    console.log("Processing custom webhooks", {
      eventType,
      integrationsCount: integrations.length,
      eventData: JSON.stringify(eventData).substring(0, 200) + "..."
    });

    const results = [];

    // Process each integration
    for (const integration of integrations) {
      if (!integration.enabled || !integration.events.includes(eventType)) {
        console.log(`Skipping integration ${integration.name} - not enabled or event not configured`);
        continue;
      }

      let success = false;
      let lastError = null;
      let attempt = 0;

      // Retry logic
      while (!success && attempt <= retryConfig.maxRetries) {
        try {
          attempt++;
          console.log(`Attempting webhook ${integration.name} (attempt ${attempt})`);

          const payload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            data: eventData,
            integration: {
              id: integration.id,
              name: integration.name
            }
          };

          const response = await fetch(integration.endpoint, {
            method: integration.method,
            headers: {
              "Content-Type": "application/json",
              ...integration.headers,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            success = true;
            const responseText = await response.text();
            
            results.push({
              integration: integration.name,
              success: true,
              attempt,
              response: responseText.substring(0, 500) // Limit response size
            });

            console.log(`Webhook ${integration.name} successful on attempt ${attempt}`);
          } else {
            const errorText = await response.text();
            lastError = `HTTP ${response.status}: ${errorText}`;
            
            if (attempt <= retryConfig.maxRetries) {
              console.log(`Webhook ${integration.name} failed (attempt ${attempt}): ${lastError}. Retrying...`);
              await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * 1000));
            }
          }
        } catch (error: any) {
          lastError = error.message;
          
          if (attempt <= retryConfig.maxRetries) {
            console.log(`Webhook ${integration.name} error (attempt ${attempt}): ${lastError}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * 1000));
          }
        }
      }

      if (!success) {
        results.push({
          integration: integration.name,
          success: false,
          attempts: attempt,
          error: lastError
        });

        console.error(`Webhook ${integration.name} failed after ${attempt} attempts: ${lastError}`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${results.length} integrations: ${successCount} successful, ${failCount} failed`,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failCount
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-custom-webhook function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);