import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { useMemo, useRef, useState } from "react";
import { Boxes, Download, Loader2, MapPin, Plus, QrCode, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resources")({
  component: ResourcesPage,
  head: () => ({
    meta: [
      { title: "Resource inventory & QR codes — CRMCRS" },
      { name: "description", content: "Campus asset inventory with printable QR codes for instant issue reporting." },
      { property: "og:title", content: "Resource inventory & QR codes — CRMCRS" },
      { property: "og:description", content: "Campus asset inventory with printable QR codes for instant issue reporting." },
    ],
  }),
});

const CATEGORIES = [
  "fan", "light", "projector", "computer", "printer", "ac", "desk", "chair",
  "bench", "lab_equipment", "internet", "electrical", "plumbing",
  "water_cooler", "washroom", "cleanliness", "other",
] as const;

type Resource = {
  id: string;
  code: string;
  name: string;
  category: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  active: boolean;
};

function ResourcesPage() {
  const { isStaff } = useRole();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState<Resource | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "other",
    building: "",
    floor: "",
    room: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id,code,name,category,building,floor,room,active")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data as Resource[];
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((r) =>
      [r.code, r.name, r.category, r.building, r.room]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, query]);

  const submit = async () => {
    if (form.code.trim().length < 2 || form.name.trim().length < 2) {
      toast.error("Code and name are required");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("resources").insert({
        code: form.code.trim().toUpperCase().slice(0, 40),
        name: form.name.trim().slice(0, 120),
        category: form.category as (typeof CATEGORIES)[number],
        building: form.building.trim().slice(0, 100) || null,
        floor: form.floor.trim().slice(0, 20) || null,
        room: form.room.trim().slice(0, 50) || null,
        created_by: auth.user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Resource added");
      setOpen(false);
      setForm({ code: "", name: "", category: "other", building: "", floor: "", room: "" });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add resource");
    } finally {
      setSaving(false);
    }
  };

  const reportUrl = (code: string) =>
    typeof window === "undefined" ? `/report/${code}` : `${window.location.origin}/report/${code}`;

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas || !qr) return;
    const link = document.createElement("a");
    link.download = `qr-${qr.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources &amp; QR codes</h1>
          <p className="text-sm text-muted-foreground">
            Every asset gets a QR code — scan it to report a problem in seconds.
          </p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> Add resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="r-code">Asset code</Label>
                    <Input
                      id="r-code"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="PRJ-A204"
                    />
                  </div>
                  <div>
                    <Label htmlFor="r-name">Name</Label>
                    <Input
                      id="r-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Epson projector"
                    />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="r-building">Building</Label>
                    <Input id="r-building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="Block A" />
                  </div>
                  <div>
                    <Label htmlFor="r-floor">Floor</Label>
                    <Input id="r-floor" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="2" />
                  </div>
                  <div>
                    <Label htmlFor="r-room">Room</Label>
                    <Input id="r-room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="204" />
                  </div>
                </div>
                <Button onClick={submit} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save resource
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search assets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !filtered.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No resources yet</p>
          <p className="text-sm text-muted-foreground">
            {isStaff ? "Add your first asset to generate its QR code." : "Ask staff to register campus assets."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{r.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{r.code}</div>
                </div>
                <Badge variant="outline" className="capitalize">{r.category.replace("_", " ")}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[r.building, r.floor && `Floor ${r.floor}`, r.room && `Room ${r.room}`]
                  .filter(Boolean)
                  .join(" · ") || "No location"}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setQr(r)}>
                  <QrCode className="mr-1.5 h-4 w-4" /> QR code
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/report/$code" params={{ code: r.code }}>Report</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!qr} onOpenChange={(o) => !o && setQr(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{qr?.name}</DialogTitle>
          </DialogHeader>
          {qr && (
            <div className="space-y-4 text-center">
              <div ref={qrRef} className="mx-auto w-fit rounded-2xl border bg-white p-5">
                <QRCodeCanvas value={reportUrl(qr.code)} size={220} marginSize={2} />
              </div>
              <p className="font-mono text-sm text-muted-foreground">{qr.code}</p>
              <Button onClick={downloadQr} className="w-full gradient-primary text-primary-foreground">
                <Download className="mr-2 h-4 w-4" /> Download PNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
