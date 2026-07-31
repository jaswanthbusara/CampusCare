import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, PriorityBadge } from "@/components/crmcrs/badges";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Loader2, MapPin, Star, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/complaints/$id")({
  component: ComplaintDetail,
  head: () => ({
    meta: [
      { title: "Complaint details — CRMCRS" },
      { name: "description", content: "View complaint status, photos, remarks and resolution feedback." },
      { property: "og:title", content: "Complaint details — CRMCRS" },
      { property: "og:description", content: "Track a campus complaint from submission to resolution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const STATUSES = ["submitted", "assigned", "in_progress", "completed", "rejected"] as const;

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [savingStatus, setSavingStatus] = useState(false);
  const [remarks, setRemarks] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  const { data: roles } = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      return data.map((r) => r.role as string);
    },
  });
  const isStaff = !!roles?.some((r) => r === "admin" || r === "staff");

  const { data, isLoading, error } = useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data: complaint, error: cErr } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cErr) throw cErr;
      if (!complaint) return null;

      const [{ data: images }, { data: feedback }] = await Promise.all([
        supabase.from("complaint_images").select("id, storage_path").eq("complaint_id", id),
        supabase.from("complaint_feedback").select("*").eq("complaint_id", id).maybeSingle(),
      ]);

      const urls: string[] = [];
      for (const img of images ?? []) {
        const { data: signed } = await supabase.storage
          .from("complaint-images")
          .createSignedUrl(img.storage_path, 3600);
        if (signed?.signedUrl) urls.push(signed.signedUrl);
      }
      return { complaint, urls, feedback };
    },
  });

  const complaint = data?.complaint;
  const isOwner = complaint?.user_id === user.id;

  const updateStatus = async (status: string) => {
    setSavingStatus(true);
    try {
      const { error: uErr } = await supabase
        .from("complaints")
        .update({
          status: status as never,
          remarks: remarks ?? complaint?.remarks ?? null,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (uErr) throw uErr;
      toast.success("Complaint updated");
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingStatus(false);
    }
  };

  const submitFeedback = async () => {
    if (!rating) return toast.error("Pick a rating first");
    setSavingFeedback(true);
    try {
      const { error: fErr } = await supabase.from("complaint_feedback").insert({
        complaint_id: id,
        user_id: user.id,
        rating,
        review: review.trim() || null,
      });
      if (fErr) throw fErr;
      toast.success("Thanks for your feedback!");
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading complaint...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center shadow-soft">
        <div className="font-medium">Complaint not found</div>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been removed or you don't have access to it.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/complaints" })}>
          Back to complaints
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/complaints"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to complaints
      </Link>

      <div className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} />
          <span className="text-xs capitalize text-muted-foreground">
            {complaint.category.replace(/_/g, " ")}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{complaint.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{complaint.description}</p>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {[complaint.building, complaint.floor && `Floor ${complaint.floor}`, complaint.room && `Room ${complaint.room}`]
              .filter(Boolean)
              .join(" · ") || "No location given"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Reported {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
          </span>
          {complaint.completed_at && (
            <span>Completed {format(new Date(complaint.completed_at), "d MMM yyyy, HH:mm")}</span>
          )}
        </div>

        {complaint.remarks && (
          <div className="mt-4 rounded-xl border bg-accent/40 p-3 text-sm">
            <div className="font-medium">Staff remarks</div>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{complaint.remarks}</p>
          </div>
        )}
      </div>

      {data.urls.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-3 font-semibold">Photos</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.urls.map((u) => (
              <img
                key={u}
                src={u}
                alt={`Photo attached to complaint: ${complaint.title}`}
                loading="lazy"
                className="aspect-video w-full rounded-xl border object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {isStaff && (
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="font-semibold">Manage complaint</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={complaint.status} onValueChange={updateStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                rows={3}
                placeholder="Add an update for the reporter..."
                value={remarks ?? complaint.remarks ?? ""}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-4 gradient-primary text-primary-foreground"
            disabled={savingStatus}
            onClick={() => updateStatus(complaint.status)}
          >
            {savingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save remarks
          </Button>
        </div>
      )}

      {complaint.status === "completed" && (
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="font-semibold">Resolution feedback</div>
          {data.feedback ? (
            <div className="mt-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-5 w-5 ${
                      n <= data.feedback!.rating ? "fill-warning text-warning" : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
              {data.feedback.review && (
                <p className="mt-2 text-sm text-muted-foreground">{data.feedback.review}</p>
              )}
            </div>
          ) : isOwner ? (
            <div className="mt-3 space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`Rate ${n} stars`}>
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        n <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                rows={3}
                placeholder="How was the resolution? (optional)"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <Button
                onClick={submitFeedback}
                disabled={savingFeedback}
                className="gradient-primary text-primary-foreground"
              >
                {savingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit feedback
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No feedback submitted yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
