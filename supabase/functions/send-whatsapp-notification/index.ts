import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppRequest {
  userName: string;
  userEmail: string;
  phoneNumbers: string[];
  apiToken: string;
  instanceId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WhatsApp notification function called');
    
    if (req.method === 'POST') {
      const { userName, userEmail, phoneNumbers, apiToken, instanceId }: WhatsAppRequest = await req.json();
      
      console.log('Processing WhatsApp notification for:', { userName, userEmail, phoneCount: phoneNumbers.length });

      if (!apiToken || !instanceId) {
        throw new Error('WhatsApp API token and instance ID are required');
      }

      if (!phoneNumbers || phoneNumbers.length === 0) {
        throw new Error('At least one phone number is required');
      }

      // Prepare the message
      const message = `🏋️ New Gym Registration Alert!\n\n` +
                    `👤 Name: ${userName}\n` +
                    `📧 Email: ${userEmail}\n` +
                    `📅 Date: ${new Date().toLocaleString()}\n\n` +
                    `Please welcome our new member! 💪`;

      const results = [];

      // Send message to each phone number
      for (const phoneNumber of phoneNumbers) {
        try {
          console.log(`Sending WhatsApp to: ${phoneNumber}`);
          
          // Using a generic WhatsApp API endpoint structure
          // You may need to adjust this based on your WhatsApp API provider
          const response = await fetch(`https://api.whatsapp.com/send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phoneNumber.replace(/[^0-9]/g, ''), // Remove any formatting
              type: "text",
              text: {
                body: message
              }
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`WhatsApp sent successfully to ${phoneNumber}:`, result);
            results.push({
              phoneNumber,
              status: 'success',
              messageId: result.messages?.[0]?.id || 'unknown'
            });
          } else {
            const errorText = await response.text();
            console.error(`Failed to send WhatsApp to ${phoneNumber}:`, errorText);
            results.push({
              phoneNumber,
              status: 'failed',
              error: errorText
            });
          }
        } catch (error) {
          console.error(`Error sending WhatsApp to ${phoneNumber}:`, error);
          results.push({
            phoneNumber,
            status: 'failed',
            error: error.message
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'WhatsApp notifications processed',
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );

  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send WhatsApp notification',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})