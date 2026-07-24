import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  assigned: { label: "Assigned", className: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { label: "In progress", className: "bg-primary/15 text-primary border-primary/30" },
  completed: { label: "Completed", className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const priorityMap: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
  medium: { label: "Medium", className: "bg-primary/10 text-primary border-primary/20" },
  high: { label: "High", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  critical: { label: "Critical", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priorityMap[priority] ?? { label: priority, className: "" };
  return <Badge variant="outline" className={p.className}>{p.label}</Badge>;
}
