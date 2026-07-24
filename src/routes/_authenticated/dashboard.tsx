import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/crmcrs/badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — CRMCRS" }] }),
});

function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [total, pending, inProgress, completed] = await Promise.all([
        supabase.from("complaints").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "completed"),
      ]);
      return {
        total: total.count ?? 0,
        pending: pending.count ?? 0,
        inProgress: inProgress.count ?? 0,
        completed: completed.count ?? 0,
      };
    },
  });
}

function useRecentComplaints() {
  return useQuery({
    queryKey: ["recent-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, title, category, priority, status, created_at, building, room")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });
}

function Card({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wrench;
  label: string;
  value: number;
  tone: "primary" | "warning" | "success" | "destructive";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: recent } = useRecentComplaints();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of campus complaints and activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={Wrench} label="Total complaints" value={stats?.total ?? 0} tone="primary" />
        <Card icon={Clock} label="Pending review" value={stats?.pending ?? 0} tone="warning" />
        <Card icon={AlertTriangle} label="In progress" value={stats?.inProgress ?? 0} tone="destructive" />
        <Card icon={CheckCircle2} label="Completed" value={stats?.completed ?? 0} tone="success" />
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <div className="font-semibold">Recent complaints</div>
            <div className="text-xs text-muted-foreground">Latest activity across campus</div>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/complaints">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="divide-y">
          {(recent ?? []).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No complaints yet.{" "}
              <Link to="/complaints/new" className="text-primary hover:underline">
                Create the first one
              </Link>
              .
            </div>
          ) : (
            recent!.map((c) => (
              <Link
                key={c.id}
                to="/complaints"
                className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.title}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.category.replace("_", " ")}
                    {c.building ? ` · ${c.building}` : ""}
                    {c.room ? ` · Room ${c.room}` : ""}
                  </div>
                </div>
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
