
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("[EdgeFunction create-trainer-user] Function cold start. Updated: 2025-05-16");

serve(async (req) => {
  const requestStartTime = Date.now();
  console.log(`[EdgeFunction create-trainer-user] Received ${req.method} request to ${req.url}`);

  if (req.method === "OPTIONS") {
    console.log("[EdgeFunction create-trainer-user] Handling OPTIONS request.");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password } = body;
    console.log("[EdgeFunction create-trainer-user] Request body parsed:", { email, passwordProvided: !!password });

    if (!email || !password) {
      console.error("[EdgeFunction create-trainer-user] Missing email or password in request body.");
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl) {
      console.error("[EdgeFunction create-trainer-user] CRITICAL: SUPABASE_URL is not set in function environment variables.");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Supabase URL for function." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    if (!serviceRoleKey) {
      console.error("[EdgeFunction create-trainer-user] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set in function environment variables. This key is required for admin operations.");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Supabase Service Role Key for function. Please configure this secret in your Supabase project settings for this function." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    console.log("[EdgeFunction create-trainer-user] Supabase URL and Service Role Key retrieved from environment.");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    console.log("[EdgeFunction create-trainer-user] Supabase admin client initialized.");

    console.log(`[EdgeFunction create-trainer-user] Attempting to create user: ${email} with app_metadata role: trainer`);
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      app_metadata: {
        role: 'trainer', // Set the role to 'trainer'
      }
    });

    if (userError) {
      console.error("[EdgeFunction create-trainer-user] Error from supabaseAdmin.auth.admin.createUser:", JSON.stringify(userError));
      let errorMessage = userError.message || "Failed to create auth user.";
      let errorStatus = 500;

      if (userError.message.includes("User already registered") || (userError.message.includes("already exists") && userError.message.includes("Email rate limit")) || userError.message.includes("duplicate key value violates unique constraint")) {
        errorMessage = "A user with this email already exists or an email rate limit was exceeded.";
        errorStatus = 409; // Conflict
        console.warn(`[EdgeFunction create-trainer-user] Conflict: User ${email} already exists or email rate limit hit.`);
      } else if (userError.message.includes("validation_failed") && userError.message.includes("password")) {
        errorMessage = "Password does not meet requirements. " + userError.message;
        errorStatus = 400; 
      } else if (userError.message.includes("permission denied") || userError.message.includes("Authorization error")) {
         errorMessage = "Function does not have permission for this operation. Check Service Role Key.";
         errorStatus = 403; // Forbidden
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: errorStatus,
      });
    }

    if (!userData || !userData.user) {
        console.error("[EdgeFunction create-trainer-user] User data or user object is null/undefined after creation attempt, despite no explicit error from createUser.");
        return new Response(JSON.stringify({ error: "Auth user creation failed unexpectedly (no user data returned from Supabase)." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }

    console.log(`[EdgeFunction create-trainer-user] Auth user created successfully: User ID: ${userData.user.id}, Email: ${userData.user.email}, Role: ${userData.user.app_metadata?.role}. Request took ${Date.now() - requestStartTime}ms.`);
    return new Response(JSON.stringify({ message: "Auth user created successfully.", userId: userData.user.id, email: userData.user.email, role: userData.user.app_metadata?.role }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[EdgeFunction create-trainer-user] General error in function handler:", error, error.stack);
    let errorMessage = "An unexpected error occurred in the Edge Function.";
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = "Invalid JSON in request body.";
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
