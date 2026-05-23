import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

type Tpl = {
  id: string;
  template_key: string;
  category: string;
  display_name: string;
  enabled: boolean;
  sender_name: string | null;
  subject: string | null;
  preheader: string | null;
  heading: string | null;
  intro: string | null;
  body: string | null;
  button_label: string | null;
  footer_text: string | null;
  accent_color: string | null;
};

export default function EmailTemplatesAdmin() {
  const [items, setItems] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tpl | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("display_name", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data as Tpl[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (t: Tpl, v: boolean) => {
    const { error } = await supabase.from("email_templates").update({ enabled: v }).eq("id", t.id);
    if (error) return toast.error(error.message);
    setItems(items.map(i => i.id === t.id ? { ...i, enabled: v } : i));
    toast.success(v ? "Template enabled" : "Template disabled");
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { id, ...rest } = editing;
    const { error } = await supabase.from("email_templates").update(rest).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Template updated");
    setEditing(null);
    load();
  };

  const grouped = items.reduce<Record<string, Tpl[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Customize the sender name, subject and content of every notification email.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          Object.entries(grouped).map(([cat, list]) => (
            <Card key={cat} className="mb-6">
              <CardHeader>
                <CardTitle className="capitalize">{cat === "auth" ? "Authentication Emails" : "App Notifications"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="w-24">Enabled</TableHead>
                      <TableHead className="w-24 text-right">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-medium">{t.display_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{t.template_key}</div>
                        </TableCell>
                        <TableCell className="text-sm">{t.sender_name || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-sm">{t.subject || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          <Switch checked={t.enabled} onCheckedChange={(v) => toggle(t, v)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing?.display_name}{" "}
                <Badge variant="outline" className="ml-2 font-mono text-xs">{editing?.template_key}</Badge>
              </DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sender name</Label>
                    <Input value={editing.sender_name || ""} onChange={e => setEditing({ ...editing, sender_name: e.target.value })} placeholder="FHB Fit" />
                  </div>
                  <div>
                    <Label>Accent color</Label>
                    <div className="flex gap-2 items-center">
                      <Input type="color" className="w-14 p-1 h-10" value={editing.accent_color || "#c9a861"} onChange={e => setEditing({ ...editing, accent_color: e.target.value })} />
                      <Input value={editing.accent_color || ""} onChange={e => setEditing({ ...editing, accent_color: e.target.value })} placeholder="#c9a861" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Subject line</Label>
                  <Input value={editing.subject || ""} onChange={e => setEditing({ ...editing, subject: e.target.value })} />
                </div>
                <div>
                  <Label>Preheader (inbox preview text)</Label>
                  <Input value={editing.preheader || ""} onChange={e => setEditing({ ...editing, preheader: e.target.value })} />
                </div>
                <div>
                  <Label>Heading</Label>
                  <Input value={editing.heading || ""} onChange={e => setEditing({ ...editing, heading: e.target.value })} />
                </div>
                <div>
                  <Label>Intro</Label>
                  <Textarea rows={2} value={editing.intro || ""} onChange={e => setEditing({ ...editing, intro: e.target.value })} />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea rows={4} value={editing.body || ""} onChange={e => setEditing({ ...editing, body: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Button label</Label>
                    <Input value={editing.button_label || ""} onChange={e => setEditing({ ...editing, button_label: e.target.value })} placeholder="(optional)" />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={editing.enabled} onCheckedChange={v => setEditing({ ...editing, enabled: v })} />
                      <Label className="!mb-0">Enabled</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Footer text</Label>
                  <Textarea rows={2} value={editing.footer_text || ""} onChange={e => setEditing({ ...editing, footer_text: e.target.value })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
