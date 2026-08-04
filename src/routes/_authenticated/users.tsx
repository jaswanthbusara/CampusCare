import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole, type AppRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { ShieldCheck, Search, UserCog } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
  head: () => ({
    meta: [
      { title: "User Management | CRMCRS" },
      { name: "description", content: "Admins manage campus user accounts and assign student, teacher, staff, or admin roles." },
      { property: "og:title", content: "User Management | CRMCRS" },
      { property: "og:description", content: "Assign and revoke campus roles for students, teachers, maintenance staff, and admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ROLES: AppRole[] = ["student", "teacher", "staff", "admin"];

const ROLE_STYLES: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  teacher: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  student: "bg-muted text-muted-foreground",
};

function UsersPage() {
  const { isAdmin, loading } = useRole();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const adminExists = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_exists");
      if (error) throw error;
      return data as boolean;
    },
  });

  const users = useQuery({
    queryKey: ["all-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, department, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
      }));
    },
  });

  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (ok) => {
      if (ok) {
        toast.success("You are now an admin");
        qc.invalidateQueries();
      } else {
        toast.error("An admin already exists");
        adminExists.refetch();
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: AppRole; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Roles updated");
      qc.invalidateQueries({ queryKey: ["all-users"] });
      qc.invalidateQueries({ queryKey: ["my-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Admins only
          </CardTitle>
          <CardDescription>
            You need the admin role to manage users.
            {adminExists.data === false && " No admin exists yet — you can claim it now."}
          </CardDescription>
        </CardHeader>
        {adminExists.data === false && (
          <CardContent>
            <Button onClick={() => claim.mutate()} disabled={claim.isPending} className="gradient-primary text-primary-foreground">
              Claim admin access
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  const list = (users.data ?? []).filter((u) => {
    const t = `${u.full_name ?? ""} ${u.email ?? ""} ${u.department ?? ""}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">Grant or revoke roles for campus members.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or department" className="pl-9" />
      </div>

      {users.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">No users found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{u.full_name ?? "Unnamed user"}</span>
                    {u.roles.map((r) => (
                      <Badge key={r} variant="outline" className={`capitalize ${ROLE_STYLES[r]}`}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-1 truncate pl-6 text-xs text-muted-foreground">
                    {u.email}
                    {u.department ? ` · ${u.department}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const has = u.roles.includes(r);
                    return (
                      <Button
                        key={r}
                        size="sm"
                        variant={has ? "default" : "outline"}
                        disabled={toggleRole.isPending}
                        onClick={() => toggleRole.mutate({ userId: u.id, role: r, has })}
                        className="capitalize"
                      >
                        {r}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
