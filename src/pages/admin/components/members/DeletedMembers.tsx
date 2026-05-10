import { useEffect, useState } from "react";
import { supabase, requireAuth } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Undo2, Archive } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeletedMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  membership: string | null;
  remaining_sessions: number | null;
  deleted_at: string;
}

const DeletedMembers = () => {
  const [members, setMembers] = useState<DeletedMember[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      await requireAuth(async () => {
        const { data, error } = await supabase
          .from("members")
          .select("id,name,email,phone,membership,remaining_sessions,deleted_at" as any)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false });
        if (error) throw error;
        setMembers((data as any) || []);
      });
    } catch (err: any) {
      toast({ title: "Failed to load deleted members", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const restore = async (id: number) => {
    setBusyId(id);
    try {
      await requireAuth(async () => {
        const { error } = await supabase
          .from("members")
          .update({ deleted_at: null } as any)
          .eq("id", id);
        if (error) throw error;
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast({ title: "Member restored", description: "The member is now visible again." });
      });
    } catch (err: any) {
      toast({ title: "Failed to restore member", description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const permanentlyDelete = async (member: DeletedMember) => {
    setBusyId(member.id);
    try {
      await requireAuth(async () => {
        const { error } = await supabase.from("members").delete().eq("id", member.id);
        if (error) throw error;

        // Best-effort: delete the auth user too
        try {
          await supabase.functions.invoke("delete-user", { body: { email: member.email } });
        } catch (e) {
          console.warn("Auth user deletion failed (record already removed):", e);
        }

        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast({ title: "Member permanently deleted" });
      });
    } catch (err: any) {
      toast({ title: "Failed to delete permanently", description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Archive className="h-5 w-5 text-gym-blue" />
          <CardTitle>Deleted Members</CardTitle>
        </div>
        <CardDescription>
          Hidden members are kept here. Restore them anytime to bring back their bookings, sessions and history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deleted members.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-md p-3"
              >
                <div className="space-y-1">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {m.email} {m.phone ? `• ${m.phone}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.membership || "—"} • {m.remaining_sessions ?? 0} sessions left • Deleted{" "}
                    {new Date(m.deleted_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restore(m.id)}
                    disabled={busyId === m.id}
                  >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={busyId === m.id}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete forever
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete {m.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the member record completely and cannot be undone. The
                          authentication account will also be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => permanentlyDelete(m)}>
                          Delete forever
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeletedMembers;
