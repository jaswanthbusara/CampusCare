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

export const Route = createFileRoute("/_authenticated/lost-found/new")({
  component: NewLostFound,
  head: () => ({ meta: [{ title: "Report item — CRMCRS" }] }),
});

const CATEGORIES = [
  "electronics",
  "id_card",
  "wallet",
  "keys",
  "bag",
  "book",
  "clothing",
  "jewelry",
  "documents",
  "bottle",
  "umbrella",
  "other",
] as const;

const schema = z.object({
  type: z.enum(["lost", "found"]),
  title: z.string().trim().min(3, "At least 3 characters").max(120),
  description: z.string().trim().min(10, "Add more detail (min 10 chars)").max(2000),
  category: z.enum(CATEGORIES),
  location: z.string().trim().max(150).optional(),
  occurred_on: z.string().optional(),
  contact_info: z.string().trim().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

function NewLostFound() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "lost", category: "other" },
  });

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      let image_path: string | null = null;
      if (file) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("lost-found-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        image_path = path;
      }

      const { error } = await supabase.from("lost_items").insert({
        user_id: user.id,
        type: values.type,
        title: values.title,
        description: values.description,
        category: values.category,
        location: values.location || null,
        occurred_on: values.occurred_on || null,
        contact_info: values.contact_info || null,
        image_path,
      });
      if (error) throw error;

      toast.success("Item posted");
      navigate({ to: "/lost-found" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const onFile = (list: FileList | null) => {
    if (!list || !list[0]) return;
    const f = list[0];
    if (!f.type.startsWith("image/") || f.size >= 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB");
      return;
    }
    setFile(f);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report an item</h1>
        <p className="text-sm text-muted-foreground">
          Post a lost item so someone who finds it can reach you, or post a found item so its owner can claim it.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft"
      >
        <div>
          <Label>I am reporting</Label>
          <Select
            defaultValue="lost"
            onValueChange={(v) => form.setValue("type", v as FormData["type"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lost">Something I lost</SelectItem>
              <SelectItem value="found">Something I found</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} placeholder="Black leather wallet" />
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
            placeholder="Distinctive marks, color, brand, contents..."
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
                    {c.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="occurred_on">Date (lost/found)</Label>
            <Input id="occurred_on" type="date" {...form.register("occurred_on")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...form.register("location")} placeholder="Library, 2nd floor" />
          </div>
          <div>
            <Label htmlFor="contact_info">Contact info</Label>
            <Input
              id="contact_info"
              {...form.register("contact_info")}
              placeholder="Phone or email (optional)"
            />
          </div>
        </div>

        <div>
          <Label>Photo (optional)</Label>
          <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/30">
            <Upload className="h-5 w-5" />
            {file ? "Change photo" : "Drop a photo or click to upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files)}
            />
          </label>
          {file && (
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="group relative overflow-hidden rounded-lg border">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-24 w-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/lost-found" })}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="gradient-primary text-primary-foreground"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Post item
          </Button>
        </div>
      </form>
    </div>
  );
}
