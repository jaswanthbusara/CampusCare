import { createFileRoute, Outlet, redirect, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Wrench,
  Bell,
  LogOut,
  Plus,
  User as UserIcon,
  PackageSearch,
  Megaphone,
  Sparkles,
  Boxes,
  BarChart3,
  Users,
  ShieldAlert,


} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/complaints", label: "Complaints", icon: Wrench },
  { to: "/cleaning", label: "Cleanliness", icon: Sparkles },
  { to: "/safety", label: "Ragging & Harassment", icon: ShieldAlert },
  { to: "/lost-found", label: "Lost & Found", icon: PackageSearch },
  { to: "/resources", label: "Resources", icon: Boxes },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const adminNav = [{ to: "/users", label: "Users", icon: Users } as const];



function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role, setRole] = useState<string>("student");
  const [name, setName] = useState<string>(user.email ?? "");

  useEffect(() => {
    (async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      if (roles && roles.length) {
        const priority = ["admin", "staff", "teacher", "student"];
        const best = priority.find((r) => roles.some((x) => x.role === r));
        if (best) setRole(best);
      }
      if (profile?.full_name) setName(profile.full_name);
    })();
  }, [user.id]);

  const navItems = role === "admin" ? [...nav, ...adminNav] : [...nav];


  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="font-bold">Campus Care</div>
        </div>
        <nav className="p-3">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3 rounded-xl border bg-background p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="text-xs capitalize text-muted-foreground">{role}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div className="font-semibold">Campus Care</div>
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">
            Welcome back, <span className="font-medium text-foreground">{name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/complaints/new">
                <Plus className="mr-1.5 h-4 w-4" /> New complaint
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile nav strip */}
        <nav className="flex gap-1 overflow-x-auto border-b bg-card p-2 lg:hidden">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
