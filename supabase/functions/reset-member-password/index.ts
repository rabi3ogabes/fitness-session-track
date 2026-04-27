import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    const claims = claimsData?.claims as Record<string, any> | undefined;
    const callerRole = claims?.app_metadata?.role ?? claims?.user_metadata?.role;

    if (claimsError || !claims || callerRole !== "admin") {
      return new Response(JSON.stringify({ error: "Only admins can reset passwords" }), {
        status: claims ? 403 : 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, newPassword } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword = typeof newPassword === "string" ? newPassword.trim() : "";

    if (!normalizedEmail || !normalizedPassword) {
      return new Response(JSON.stringify({ error: "Email and newPassword are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: member, error: memberError } = await adminClient
      .from("members")
      .select("name, email, phone, gender, membership, remaining_sessions, total_sessions")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (memberError) {
      console.error("member lookup error:", memberError);
      return new Response(JSON.stringify({ error: "Failed to load member record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!member) {
      return new Response(JSON.stringify({ error: `No member found with email: ${normalizedEmail}` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("listUsers error:", listError);
      return new Response(JSON.stringify({ error: `Failed to list users: ${listError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUser = usersData.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    const membershipType = member.membership && member.membership !== "null" ? member.membership : null;

    if (!targetUser) {
      const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: normalizedPassword,
        email_confirm: true,
        app_metadata: { role: "user" },
        user_metadata: {
          name: member.name,
          phone_number: member.phone ?? "",
          role: "user",
        },
      });

      if (createUserError || !createdUserData?.user) {
        console.error("createUser error:", createUserError);
        return new Response(JSON.stringify({ error: createUserError?.message ?? "Failed to create auth user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      targetUser = createdUserData.user;
    } else {
      const { error: updateUserError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
        password: normalizedPassword,
        user_metadata: {
          ...targetUser.user_metadata,
          name: targetUser.user_metadata?.name ?? member.name,
          phone_number: targetUser.user_metadata?.phone_number ?? member.phone ?? "",
          role: targetUser.user_metadata?.role ?? "user",
        },
        app_metadata: {
          ...targetUser.app_metadata,
          role: targetUser.app_metadata?.role ?? "user",
        },
      });

      if (updateUserError) {
        console.error("updateUser error:", updateUserError);
        return new Response(JSON.stringify({ error: updateUserError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: targetUser.id,
      email: normalizedEmail,
      name: member.name,
      phone_number: member.phone ?? "",
      gender: member.gender ?? null,
      membership_type: membershipType,
      sessions_remaining: member.remaining_sessions ?? 0,
      total_sessions: member.total_sessions ?? 0,
    });

    if (profileError) {
      console.error("profile upsert error:", profileError);
      return new Response(JSON.stringify({ error: `Password updated, but profile sync failed: ${profileError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Password reset successfully for:", normalizedEmail, "auth user:", targetUser.id);
    return new Response(JSON.stringify({ success: true, createdAuthUser: !usersData.users.find((user) => user.email?.toLowerCase() === normalizedEmail) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
