import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/reset-member-password`;

Deno.test("OPTIONS preflight returns CORS headers", async () => {
  const res = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, content-type",
    },
  });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  const allowMethods = res.headers.get("access-control-allow-methods") ?? "";
  if (!allowMethods.includes("POST")) throw new Error(`Missing POST in allow-methods: ${allowMethods}`);
});

Deno.test("POST without auth returns 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: "x@y.com", newPassword: "12345678" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "No authorization header");
});

Deno.test("POST with non-admin token returns 403", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email: "x@y.com", newPassword: "12345678" }),
  });
  const body = await res.json();
  await Promise.resolve();
  if (res.status !== 401 && res.status !== 403) {
    throw new Error(`Expected 401/403, got ${res.status}: ${JSON.stringify(body)}`);
  }
});
