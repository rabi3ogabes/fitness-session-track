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
  console.log('=== WhatsApp notification function called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing POST request for WhatsApp notification');
    
    if (req.method === 'POST') {
      const requestBody = await req.json();
      console.log('Request body received:', requestBody);
      
      const { userName, userEmail, phoneNumbers, apiToken, instanceId }: WhatsAppRequest = requestBody;
      
      console.log('Processing WhatsApp notification for:', { 
        userName, 
        userEmail, 
        phoneCount: phoneNumbers?.length || 0,
        hasApiToken: !!apiToken,
        hasInstanceId: !!instanceId
      });

      if (!apiToken || !instanceId) {
        console.error('Missing API credentials');
        throw new Error('WhatsApp API token and instance ID are required');
      }

      if (!phoneNumbers || phoneNumbers.length === 0) {
        console.error('Missing phone numbers');
        throw new Error('At least one phone number is required');
      }

      // Prepare the message
      const message = `🏋️ New Gym Registration Alert!\n\n` +
                    `👤 Name: ${userName}\n` +
                    `📧 Email: ${userEmail}\n` +
                    `📅 Date: ${new Date().toLocaleString()}\n\n` +
                    `Please welcome our new member! 💪`;

      console.log('Prepared message:', message);
      const results = [];

      // Send message to each phone number using Green API
      for (const phoneNumber of phoneNumbers) {
        try {
          console.log(`Sending WhatsApp to: ${phoneNumber} via Green API`);
          
          // Green API endpoint format
          const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, ''); // Remove any formatting
          const apiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
          
          console.log(`API URL: ${apiUrl}`);
          console.log(`Clean phone number: ${cleanPhoneNumber}`);
          
          const requestData = {
            chatId: `${cleanPhoneNumber}@c.us`,
            message: message
          };
          
          console.log('Sending request data:', requestData);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          });

          console.log(`Response status: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            console.log(`WhatsApp sent successfully to ${phoneNumber}:`, result);
            results.push({
              phoneNumber,
              status: 'success',
              messageId: result.idMessage || result.id || 'unknown'
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

      console.log('Final results:', results);

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

    console.log('Method not allowed:', req.method);
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