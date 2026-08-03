import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, MapPin, QrCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/report/$code")({
  component: QuickReport,
  head: () => ({
    meta: [
      { title: "Scan & report — CRMCRS" },
      { name: "description", content: "Report an issue for a scanned campus asset in a few taps." },
      { property: "og:title", content: "Scan & report — CRMCRS" },
      { property: "og:description", content: "Report an issue for a scanned campus asset in a few taps." },
    ],
  }),
});

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

function QuickReport() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("medium");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: resource, isLoading } = useQuery({
    queryKey: ["resource", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id,code,name,category,building,floor,room,active")
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = async () => {
    if (!resource) return;
    const finalTitle = (title.trim() || `Issue with ${resource.name}`).slice(0, 120);
    if (description.trim().length < 10) {
      toast.error("Describe the issue in at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("complaints")
        .insert({
          user_id: auth.user.id,
          title: finalTitle,
          description: `${description.trim().slice(0, 1900)}\n\n[Asset: ${resource.code}]`,
          category: resource.category,
          priority,
          building: resource.building,
          floor: resource.floor,
          room: resource.room,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Reported — maintenance has been notified");
      navigate({ to: "/complaints/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed p-12 text-center">
        <QrCode className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium">Unknown asset code</p>
        <p className="text-sm text-muted-foreground">
          No resource is registered with the code <span className="font-mono">{code}</span>.
        </p>
        <Button className="mt-4" onClick={() => navigate({ to: "/complaints/new" })}>
          File a regular complaint
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">{resource.code}</span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight">{resource.name}</h1>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {[resource.building, resource.floor && `Floor ${resource.floor}`, resource.room && `Room ${resource.room}`]
                .filter(Boolean)
                .join(" · ") || "No location on file"}
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {resource.category.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
        <div>
          <Label htmlFor="q-title">Title (optional)</Label>
          <Input
            id="q-title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Issue with ${resource.name}`}
          />
        </div>
        <div>
          <Label htmlFor="q-desc">What's wrong?</Label>
          <Textarea
            id="q-desc"
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem..."
          />
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={submit}
          disabled={submitting}
          className="w-full gradient-primary text-primary-foreground"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit report
        </Button>
      </div>
    </div>
  );
}
