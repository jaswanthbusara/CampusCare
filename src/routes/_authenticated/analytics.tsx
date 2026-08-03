import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics & reports — CRMCRS" },
      { name: "description", content: "Campus complaint analytics: volume by status, category, priority and resolution time." },
      { property: "og:title", content: "Analytics & reports — CRMCRS" },
      { property: "og:description", content: "Campus complaint analytics: volume by status, category, priority and resolution time." },
    ],
  }),
});

const COLORS = [
  "hsl(217 91% 60%)",
  "hsl(160 84% 39%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(258 90% 66%)",
  "hsl(199 89% 48%)",
  "hsl(340 82% 52%)",
];

type Row = {
  id: string;
  status: string;
  category: string;
  priority: string;
  created_at: string;
  completed_at: string | null;
  title: string;
  building: string | null;
};

function AnalyticsPage() {
  const { isStaff, loading } = useRole();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-complaints"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id,status,category,priority,created_at,completed_at,title,building")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as Row[];
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const count = (key: keyof Row) => {
      const map = new Map<string, number>();
      rows.forEach((r) => {
        const k = String(r[key] ?? "unknown");
        map.set(k, (map.get(k) ?? 0) + 1);
      });
      return [...map.entries()]
        .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
        .sort((a, b) => b.value - a.value);
    };
    const completed = rows.filter((r) => r.completed_at);
    const avgHours = completed.length
      ? completed.reduce(
          (acc, r) =>
            acc +
            (new Date(r.completed_at as string).getTime() - new Date(r.created_at).getTime()) /
              3_600_000,
          0,
        ) / completed.length
      : 0;
    return {
      total: rows.length,
      open: rows.filter((r) => !["completed", "rejected"].includes(r.status)).length,
      completed: completed.length,
      avgHours,
      byStatus: count("status"),
      byCategory: count("category").slice(0, 8),
      byPriority: count("priority"),
      rows,
    };
  }, [data]);

  const exportCsv = () => {
    if (!stats.rows.length) return toast.error("Nothing to export");
    const header = ["id", "title", "status", "category", "priority", "building", "created_at", "completed_at"];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      header.join(","),
      ...stats.rows.map((r) =>
        [r.id, r.title, r.status, r.category, r.priority, r.building, r.created_at, r.completed_at]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `crmcrs-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed p-12 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium">Staff access only</p>
        <p className="text-sm text-muted-foreground">
          Analytics are available to maintenance staff and administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Campus-wide complaint performance across every category.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total complaints", value: stats.total },
              { label: "Currently open", value: stats.open },
              { label: "Resolved", value: stats.completed },
              {
                label: "Avg. resolution",
                value: stats.avgHours ? `${stats.avgHours.toFixed(1)} h` : "—",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="mt-1 text-3xl font-bold tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <h2 className="font-semibold">By status</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {stats.byStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <h2 className="font-semibold">By priority</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byPriority}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ opacity: 0.1 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="font-semibold">Top categories</h2>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={110} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ opacity: 0.1 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
