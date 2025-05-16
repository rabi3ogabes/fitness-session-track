
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email for simplicity, or set to false to require email verification
      user_metadata: {
        // You can add any other metadata here if needed
      },
      app_metadata: {
        role: 'trainer', // Add a role to identify them as trainers
      }
    });

    if (userError) {
      console.error("Error creating auth user:", userError);
      // Try to provide a more specific error if possible
      if (userError.message.includes("User already registered")) {
          return new Response(JSON.stringify({ error: "A user with this email already exists in the authentication system." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409, // Conflict
        });
      }
      return new Response(JSON.stringify({ error: userError.message || "Failed to create auth user." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: "Auth user created successfully.", userId: userData.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("General error in edge function:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
