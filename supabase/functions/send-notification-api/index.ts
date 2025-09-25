import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationApiRequest {
  client_id: string;
  client_secret: string;
  user_id: string;
  environment?: string;
  notification: {
    title: string;
    body: string;
    redirect_url?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      client_id, 
      client_secret, 
      user_id, 
      environment = "production",
      notification 
    }: NotificationApiRequest = await req.json();

    console.log("Sending notification via NotificationAPI.com", {
      client_id,
      user_id,
      environment,
      notification_title: notification.title
    });

    // NotificationAPI.com endpoint
    const apiUrl = environment === "production" 
      ? "https://api.notificationapi.com/notifications"
      : `https://${environment}.api.notificationapi.com/notifications`;

    // Prepare the notification payload according to NotificationAPI.com format
    const notificationPayload = {
      notificationId: "gym_notification", // You can customize this
      user: {
        id: user_id,
        email: user_id // Fallback if user_id is email
      },
      mergeTags: {
        title: notification.title,
        body: notification.body,
        redirect_url: notification.redirect_url || ""
      }
    };

    // Send notification to NotificationAPI.com
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${client_id}:${client_secret}`)}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NotificationAPI error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      throw new Error(`NotificationAPI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Notification sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent successfully via NotificationAPI.com",
        result 
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
    console.error("Error in send-notification-api function:", error);
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