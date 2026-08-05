import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MapPin, Plus, ShieldAlert, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/safety")({
  component: SafetyPage,
  head: () => ({
    meta: [
      { title: "Ragging & Harassment reporting — Campus Care" },
      {
        name: "description",
        content:
          "Confidentially report ragging, harassment or humiliation on campus. Separate girls and boys wings handled by the campus safety committee.",
      },
      { property: "og:title", content: "Ragging & Harassment reporting — Campus Care" },
      {
        property: "og:description",
        content:
          "Confidentially report ragging, harassment or humiliation on campus. Separate girls and boys wings handled by the campus safety committee.",
      },
    ],
  }),
});

const WINGS = ["girls", "boys"] as const;
type Wing = (typeof WINGS)[number];

const STATUSES = ["pending", "under_review", "action_taken", "resolved", "rejected"] as const;
type Status = (typeof STATUSES)[number];

const CATEGORIES = [
  "ragging",
  "harassment",
  "bullying",
  "cyber_bullying",
  "physical_abuse",
  "verbal_abuse",
  "other",
] as const;

const SEVERITY = ["low", "medium", "high", "critical"] as const;

const statusStyles: Record<Status, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  under_review: "bg-primary/10 text-primary border-primary/20",
  action_taken: "bg-primary/15 text-primary border-primary/30",
  resolved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

type Report = {
  id: string;
  wing: Wing;
  category: string;
  title: string;
  description: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  incident_date: string | null;
  is_anonymous: boolean;
  severity: string;
  status: Status;
  remarks: string | null;
  created_at: string;
  user_id: string;
};

const emptyForm = {
  wing: "girls" as Wing,
  category: "ragging" as (typeof CATEGORIES)[number],
  title: "",
  description: "",
  building: "",
  floor: "",
  room: "",
  incident_date: "",
  severity: "medium",
  is_anonymous: false,
};

function SafetyPage() {
  const { isStaff } = useRole();
  const queryClient = useQueryClient();
  const [wing, setWing] = useState<Wing>("girls");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["ragging-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ragging_reports")
        .select(
          "id,wing,category,title,description,building,floor,room,incident_date,is_anonymous,severity,status,remarks,created_at,user_id",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Report[];
    },
  });

  const filtered = useMemo(() => (data ?? []).filter((r) => r.wing === wing), [data, wing]);

  const submit = async () => {
    if (form.title.trim().length < 3 || form.description.trim().length < 10) {
      toast.error("Add a title and a description of at least 10 characters");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("ragging_reports").insert({
        user_id: auth.user.id,
        wing: form.wing,
        category: form.category,
        title: form.title.trim().slice(0, 120),
        description: form.description.trim().slice(0, 4000),
        building: form.building.trim().slice(0, 100) || null,
        floor: form.floor.trim().slice(0, 20) || null,
        room: form.room.trim().slice(0, 50) || null,
        incident_date: form.incident_date || null,
        severity: form.severity,
        is_anonymous: form.is_anonymous,
      });
      if (error) throw error;
      toast.success("Report submitted confidentially");
      setOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["ragging-reports"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("ragging_reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    queryClient.invalidateQueries({ queryKey: ["ragging-reports"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ragging &amp; Harassment</h1>
          <p className="text-sm text-muted-foreground">
            Report ragging, harassment or humiliation. Handled confidentially by the campus safety committee.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-1.5 h-4 w-4" /> File a report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>File a confidential report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Wing</Label>
                  <Select value={form.wing} onValueChange={(v) => setForm({ ...form, wing: v as Wing })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="girls">Girls wing</SelectItem>
                      <SelectItem value="boys">Boys wing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type of incident</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="r-title">Title</Label>
                <Input
                  id="r-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Short summary of the incident"
                />
              </div>

              <div>
                <Label htmlFor="r-desc">What happened?</Label>
                <Textarea
                  id="r-desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the incident, who was involved and when..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="r-building">Building</Label>
                  <Input
                    id="r-building"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    placeholder="Hostel B"
                  />
                </div>
                <div>
                  <Label htmlFor="r-floor">Floor</Label>
                  <Input
                    id="r-floor"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="r-room">Room</Label>
                  <Input
                    id="r-room"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="312"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="r-date">Date of incident</Label>
                  <Input
                    id="r-date"
                    type="date"
                    value={form.incident_date}
                    onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3 text-sm">
                <Checkbox
                  checked={form.is_anonymous}
                  onCheckedChange={(v) => setForm({ ...form, is_anonymous: v === true })}
                />
                <span>
                  Keep my identity hidden from the handling team where possible.
                  <span className="block text-xs text-muted-foreground">
                    Reports are always visible only to you and the safety committee.
                  </span>
                </span>
              </label>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving} className="gradient-primary text-primary-foreground">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          Reports are confidential — only you and the campus safety committee (staff &amp; admins) can read them.
          Girls and boys wings are tracked separately.
        </p>
      </div>

      <Tabs value={wing} onValueChange={(v) => setWing(v as Wing)}>
        <TabsList>
          <TabsTrigger value="girls">Girls wing</TabsTrigger>
          <TabsTrigger value="boys">Boys wing</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No reports in the {wing} wing yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.title}</h3>
                    <Badge variant="outline" className={statusStyles[r.status]}>
                      {r.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{r.category.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="capitalize">{r.severity}</Badge>
                    {r.is_anonymous && <Badge variant="outline">Anonymous</Badge>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {(r.building || r.room) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[r.building, r.floor && `Floor ${r.floor}`, r.room].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {r.incident_date && <span>Incident: {r.incident_date}</span>}
                    <span>Filed {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                  </div>
                  {r.remarks && (
                    <p className="mt-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
                      Committee remarks: {r.remarks}
                    </p>
                  )}
                </div>

                {isStaff && (
                  <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Status)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
