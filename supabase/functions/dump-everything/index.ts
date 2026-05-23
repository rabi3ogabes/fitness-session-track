// One-off migration dump function. Returns all public tables + auth users as JSON.
// Protected by a shared secret to avoid leaking data.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dump-token",
};

const TABLES = [
  "admin_settings",
  "admin_notification_settings",
  "membership_types",
  "trainers",
  "members",
  "profiles",
  "classes",
  "bookings",
  "membership_requests",
  "payments",
  "session_history",
  "notification_settings",
  "notification_logs",
  "webhook_delivery_logs",
  "activity_logs",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const token = req.headers.get("x-dump-token");
  const expected = Deno.env.get("DUMP_TOKEN");
  if (!expected || token !== expected) {
    return new Response("Forbidden", { status: 403, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const out: Record<string, unknown> = { tables: {}, auth_users: [] };

  for (const t of TABLES) {
    const all: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(t)
        .select("*")
        .range(from, from + pageSize - 1);
      if (error) {
        return new Response(JSON.stringify({ error: error.message, table: t }), {
          status: 500,
          headers: { ...cors, "content-type": "application/json" },
        });
      }
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    (out.tables as any)[t] = all;
  }

  // Auth users (paginated)
  const users: any[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      return new Response(JSON.stringify({ error: error.message, scope: "auth" }), {
        status: 500,
        headers: { ...cors, "content-type": "application/json" },
      });
    }
    if (!data.users.length) break;
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  out.auth_users = users;

  return new Response(JSON.stringify(out), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
