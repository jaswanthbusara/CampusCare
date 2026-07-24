import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/complaints/new")({
  component: NewComplaint,
  head: () => ({ meta: [{ title: "New complaint — CRMCRS" }] }),
});

const CATEGORIES = [
  "fan", "light", "projector", "computer", "printer", "ac", "desk", "chair",
  "bench", "lab_equipment", "internet", "electrical", "plumbing",
  "water_cooler", "washroom", "cleanliness", "other",
] as const;

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const schema = z.object({
  title: z.string().trim().min(3, "At least 3 characters").max(120),
  description: z.string().trim().min(10, "Add more detail (min 10 chars)").max(2000),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  building: z.string().trim().max(100).optional(),
  floor: z.string().trim().max(20).optional(),
  room: z.string().trim().max(50).optional(),
});

type FormData = z.infer<typeof schema>;

function NewComplaint() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "other", priority: "medium" },
  });

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: complaint, error } = await supabase
        .from("complaints")
        .insert({ ...values, user_id: user.id })
        .select("id")
        .single();
      if (error) throw error;

      // Upload images if any
      for (const file of files) {
        const path = `${user.id}/${complaint.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("complaint-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        await supabase.from("complaint_images").insert({
          complaint_id: complaint.id,
          storage_path: path,
        });
      }

      toast.success("Complaint submitted");
      navigate({ to: "/complaints" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/") && f.size < 8 * 1024 * 1024);
    setFiles((prev) => [...prev, ...arr].slice(0, 5));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New complaint</h1>
        <p className="text-sm text-muted-foreground">Report a campus issue for the maintenance team.</p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft"
      >
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} placeholder="Projector not turning on" />
          {form.formState.errors.title && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            {...form.register("description")}
            placeholder="Describe the issue in detail..."
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <Select
              defaultValue="other"
              onValueChange={(v) => form.setValue("category", v as FormData["category"])}
            >
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
          <div>
            <Label>Priority</Label>
            <Select
              defaultValue="medium"
              onValueChange={(v) => form.setValue("priority", v as FormData["priority"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="building">Building</Label>
            <Input id="building" {...form.register("building")} placeholder="Block A" />
          </div>
          <div>
            <Label htmlFor="floor">Floor</Label>
            <Input id="floor" {...form.register("floor")} placeholder="2" />
          </div>
          <div>
            <Label htmlFor="room">Room</Label>
            <Input id="room" {...form.register("room")} placeholder="204" />
          </div>
        </div>

        <div>
          <Label>Attachments (up to 5 images)</Label>
          <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/30">
            <Upload className="h-5 w-5" />
            Drop images or click to upload
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg border">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="h-20 w-20 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFiles((p) => p.filter((_, x) => x !== i))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/complaints" })}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="gradient-primary text-primary-foreground"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit complaint
          </Button>
        </div>
      </form>
    </div>
  );
}
