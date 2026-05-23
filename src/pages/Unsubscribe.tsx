import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setState("invalid");
          setError(data?.error || "Invalid or expired link");
          return;
        }
        if (data?.already_unsubscribed) {
          setEmail(data?.email || "");
          setState("already");
        } else if (data?.valid) {
          setEmail(data?.email || "");
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch (e: any) {
        setState("invalid");
        setError(e?.message || "Network error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setState("success");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "Failed to unsubscribe");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validating link…
            </div>
          )}
          {state === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">
                Unsubscribe <span className="font-medium text-foreground">{email}</span> from app emails?
              </p>
              <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
            </>
          )}
          {state === "submitting" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </div>
          )}
          {state === "success" && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm">You've been unsubscribed. You won't receive further app emails.</p>
            </div>
          )}
          {state === "already" && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm">{email} is already unsubscribed.</p>
            </div>
          )}
          {(state === "invalid" || state === "error") && (
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm">{error || "This link is invalid or has expired."}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
