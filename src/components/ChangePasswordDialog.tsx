import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  name?: string;
  /** When true, current password is not requested (used by admin self-flow if desired). */
  skipCurrentPassword?: boolean;
}

const ChangePasswordDialog = ({ isOpen, onClose, email, name, skipCurrentPassword }: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrent(""); setNext(""); setConfirm("");
  };

  const isWeakPassword = (pw: string) => {
    if (pw.length < 8) return true;
    const common = ["password", "12345678", "qwerty", "11111111", "abc12345", "iloveyou", "admin123"];
    if (common.includes(pw.toLowerCase())) return true;
    if (/^(.)\1+$/.test(pw)) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (isWeakPassword(next)) {
      toast({
        title: "Heads up: weak password",
        description: "Your password is easy to guess, but we'll accept it. Consider a stronger one next time.",
      });
    }
    setLoading(true);
    try {
      // Re-verify current password to prevent session-hijack abuse
      if (!skipCurrentPassword) {
        const { data: sess } = await supabase.auth.getUser();
        const userEmail = email || sess.user?.email;
        if (!userEmail) throw new Error("No user email on session");
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: current,
        });
        if (verifyErr) {
          toast({ title: "Current password is incorrect", variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;

      // Notification email (best-effort)
      const { data: sess } = await supabase.auth.getUser();
      const recipient = email || sess.user?.email;
      if (recipient) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "member-notification",
            recipientEmail: recipient,
            templateData: {
              eventType: "password_changed",
              memberName: name || sess.user?.user_metadata?.name || "",
            },
          },
        }).catch((err) => console.warn("password notification email failed:", err));
      }

      toast({ title: "Password updated", description: "Your password has been changed." });
      reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Could not update password", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>You will receive a confirmation email after the change.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!skipCurrentPassword && (
            <div className="space-y-2">
              <Label htmlFor="cur">Current Password</Label>
              <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conf">Confirm New Password</Label>
            <Input id="conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
