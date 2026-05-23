import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery session in the URL hash and signs the user in.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setEmail(session?.user?.email ?? null);
      }
    });
    // Also handle direct page loads where event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        setEmail(data.session.user.email ?? null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Notification email
      if (email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "member-notification",
            recipientEmail: email,
            templateData: { eventType: "password_changed" },
          },
        }).catch((err) => console.warn("password notification email failed:", err));
      }

      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Could not update password", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
        <p className="text-sm text-gray-500 mb-6">
          {ready
            ? email
              ? `Reset password for ${email}`
              : "Enter a new password below."
            : "Verifying your reset link…"}
        </p>
        {ready ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="newpw">New Password</Label>
              <Input id="newpw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmpw">Confirm Password</Label>
              <Input id="confirmpw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : (
          <div className="text-center text-sm text-gray-500 py-8">
            If this page does not unlock, the reset link may have expired. Request a new one from the login page.
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate("/login")}>Back to login</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
