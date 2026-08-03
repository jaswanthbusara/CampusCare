import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, MapPin, Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cleaning")({
  component: CleaningPage,
  head: () => ({
    meta: [
      { title: "Cleanliness requests — CRMCRS" },
      { name: "description", content: "Request campus cleaning by location and track housekeeping progress." },
      { property: "og:title", content: "Cleanliness requests — CRMCRS" },
      { property: "og:description", content: "Request campus cleaning by location and track housekeeping progress." },
    ],
  }),
});

const STATUSES = ["pending", "scheduled", "in_progress", "completed", "rejected"] as const;
type Status = (typeof STATUSES)[number];
const AREAS = ["classroom", "laboratory", "washroom", "corridor", "canteen", "library", "hostel", "ground", "other"];
const URGENCY = ["low", "medium", "high", "critical"] as const;

const statusStyles: Record<Status, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

type CleaningRequest = {
  id: string;
  building: string;
  floor: string | null;
  room: string | null;
  area_type: string;
  description: string;
  urgency: string;
  status: Status;
  remarks: string | null;
  created_at: string;
  user_id: string;
};

function CleaningPage() {
  const { isStaff } = useRole();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"all" | Status>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    building: "",
    floor: "",
    room: "",
    area_type: "classroom",
    description: "",
    urgency: "medium",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["cleaning-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaning_requests")
        .select("id,building,floor,room,area_type,description,urgency,status,remarks,created_at,user_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as CleaningRequest[];
    },
  });

  const filtered = useMemo(
    () => (data ?? []).filter((r) => tab === "all" || r.status === tab),
    [data, tab],
  );

  const submit = async () => {
    if (form.building.trim().length < 1 || form.description.trim().length < 10) {
      toast.error("Add a building and a description of at least 10 characters");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("cleaning_requests").insert({
        user_id: auth.user.id,
        building: form.building.trim().slice(0, 100),
        floor: form.floor.trim().slice(0, 20) || null,
        room: form.room.trim().slice(0, 50) || null,
        area_type: form.area_type,
        description: form.description.trim().slice(0, 2000),
        urgency: form.urgency as (typeof URGENCY)[number],
      });
      if (error) throw error;
      toast.success("Cleaning request submitted");
      setOpen(false);
      setForm({ building: "", floor: "", room: "", area_type: "classroom", description: "", urgency: "medium" });
      queryClient.invalidateQueries({ queryKey: ["cleaning-requests"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase
      .from("cleaning_requests")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    queryClient.invalidateQueries({ queryKey: ["cleaning-requests"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cleanliness</h1>
          <p className="text-sm text-muted-foreground">
            Request housekeeping for any campus area and follow its progress.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-1.5 h-4 w-4" /> Request cleaning
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request cleaning</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="c-building">Building</Label>
                  <Input
                    id="c-building"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    placeholder="Block A"
                  />
                </div>
                <div>
                  <Label htmlFor="c-floor">Floor</Label>
                  <Input
                    id="c-floor"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="c-room">Room</Label>
                  <Input
                    id="c-room"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="204"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Area type</Label>
                  <Select value={form.area_type} onValueChange={(v) => setForm({ ...form, area_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {URGENCY.map((u) => (
                        <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="c-desc">What needs cleaning?</Label>
                <Textarea
                  id="c-desc"
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Spilled paint near the last bench, needs mopping."
                />
              </div>
              <Button
                onClick={submit}
                disabled={saving}
                className="w-full gradient-primary text-primary-foreground"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s.replace("_", " ")}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !filtered.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No cleaning requests</p>
          <p className="text-sm text-muted-foreground">Submit one when an area needs attention.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusStyles[r.status]}>
                  <span className="capitalize">{r.status.replace("_", " ")}</span>
                </Badge>
                <Badge variant="outline" className="capitalize">{r.urgency}</Badge>
                <Badge variant="outline" className="capitalize">{r.area_type}</Badge>
              </div>
              <p className="mt-3 text-sm">{r.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[r.building, r.floor && `Floor ${r.floor}`, r.room && `Room ${r.room}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
              </div>
              {isStaff && (
                <div className="mt-4 border-t pt-4">
                  <Label className="text-xs">Update status</Label>
                  <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Status)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
