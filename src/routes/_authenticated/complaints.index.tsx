import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { StatusBadge, PriorityBadge } from "@/components/crmcrs/badges";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/complaints/")({
  component: ComplaintsList,
  head: () => ({ meta: [{ title: "Complaints — CRMCRS" }] }),
});

function useComplaints() {
  return useQuery({
    queryKey: ["complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, title, description, category, priority, status, building, room, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function ComplaintsList() {
  const { data, isLoading } = useComplaints();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = (data ?? []).filter((c) => {
    const matchQ =
      !q ||
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      c.description.toLowerCase().includes(q.toLowerCase());
    const matchS = status === "all" || c.status === status;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
          <p className="text-sm text-muted-foreground">Track and manage campus issues.</p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground">
          <Link to="/complaints/new">
            <Plus className="mr-1.5 h-4 w-4" /> New complaint
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-3 shadow-soft">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search complaints..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            ["all", "All"],
            ["submitted", "Submitted"],
            ["assigned", "Assigned"],
            ["in_progress", "In progress"],
            ["completed", "Completed"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatus(val)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                status === val
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-3 font-medium">No complaints found</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or{" "}
              <Link to="/complaints/new" className="text-primary hover:underline">
                submit a new complaint
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => (
              <li key={c.id} className="transition-colors hover:bg-accent/40">
                <Link
                  to="/complaints/$id"
                  params={{ id: c.id }}
                  className="flex items-start justify-between gap-4 p-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{c.title}</div>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {c.category.replace("_", " ")}
                      {c.building ? ` · ${c.building}` : ""}
                      {c.room ? ` · Room ${c.room}` : ""}
                      {" · "}
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
