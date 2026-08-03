import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Megaphone, Pin, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/announcements")({
  component: Announcements,
  head: () => ({
    meta: [
      { title: "Announcements — CRMCRS" },
      { name: "description", content: "Campus-wide notices and updates from staff and administration." },
      { property: "og:title", content: "Announcements — CRMCRS" },
      { property: "og:description", content: "Campus-wide notices and updates from staff and administration." },
    ],
  }),
});

const ROLES = ["student", "teacher", "staff", "admin"] as const;
type Role = (typeof ROLES)[number];

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: Role[] | null;
  pinned: boolean;
  created_at: string;
  created_by: string;
};

function Announcements() {
  const { isStaff } = useRole();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [audience, setAudience] = useState<Role[]>([]);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,body,audience,pinned,created_at,created_by")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const submit = async () => {
    if (title.trim().length < 3 || body.trim().length < 5) {
      toast.error("Add a longer title and message");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("announcements").insert({
        title: title.trim().slice(0, 150),
        body: body.trim().slice(0, 4000),
        pinned,
        audience: audience.length ? audience : null,
        created_by: auth.user.id,
      });
      if (error) throw error;
      toast.success("Announcement published");
      setOpen(false);
      setTitle("");
      setBody("");
      setPinned(false);
      setAudience([]);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Notices from campus administration and maintenance staff.
          </p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> New announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="a-title">Title</Label>
                  <Input
                    id="a-title"
                    value={title}
                    maxLength={150}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Water supply maintenance on Friday"
                  />
                </div>
                <div>
                  <Label htmlFor="a-body">Message</Label>
                  <Textarea
                    id="a-body"
                    rows={5}
                    maxLength={4000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Share the details..."
                  />
                </div>
                <div>
                  <Label>Audience (leave empty for everyone)</Label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {ROLES.map((r) => (
                      <label key={r} className="flex items-center gap-2 text-sm capitalize">
                        <Checkbox
                          checked={audience.includes(r)}
                          onCheckedChange={(c) =>
                            setAudience((prev) =>
                              c ? [...prev, r] : prev.filter((x) => x !== r),
                            )
                          }
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="text-sm">
                    <div className="font-medium">Pin to top</div>
                    <div className="text-muted-foreground">Keeps this notice above others</div>
                  </div>
                  <Switch checked={pinned} onCheckedChange={setPinned} />
                </div>
                <Button
                  onClick={submit}
                  disabled={saving}
                  className="w-full gradient-primary text-primary-foreground"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !data?.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No announcements yet</p>
          <p className="text-sm text-muted-foreground">Check back later for campus updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((a) => (
            <article key={a.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.pinned && (
                      <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                        <Pin className="mr-1 h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    <h2 className="text-lg font-semibold">{a.title}</h2>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                    <span>·</span>
                    <span className="capitalize">
                      {a.audience?.length ? a.audience.join(", ") : "Everyone"}
                    </span>
                  </div>
                </div>
                {isStaff && (
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
