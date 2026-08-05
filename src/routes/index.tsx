import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Search,
  Sparkles,
  Bell,
  Star,
  QrCode,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,

  LayoutDashboard,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Campus Care — Smart Campus Resource & Complaint Management" },
      {
        name: "description",
        content:
          "Report campus issues, track resolution, and manage resources with a modern, secure smart-campus platform.",
      },
      { property: "og:title", content: "Campus Care — Smart Campus Resource & Complaint Management" },
      {
        property: "og:description",
        content:
          "Report campus issues, track resolution, and manage resources with a modern, secure smart-campus platform.",
      },
    ],
  }),
});

function useStats() {
  const [stats, setStats] = useState({ resources: 0, users: 0, solved: 0, pending: 0 });
  useEffect(() => {
    (async () => {
      const [{ count: solved }, { count: pending }, { count: users }] = await Promise.all([
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).neq("status", "completed"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        resources: 500,
        users: users ?? 0,
        solved: solved ?? 0,
        pending: pending ?? 0,
      });
    })().catch(() => {});
  }, []);
  return stats;
}

function Counter({ value, label }: { value: number; label: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="text-3xl font-bold tracking-tight text-primary">{n.toLocaleString()}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

const features = [
  { icon: Wrench, title: "Complaint Management", desc: "Submit, assign, and resolve issues with a full audit trail.", to: "/complaints" },
  { icon: ShieldAlert, title: "Ragging & Harassment", desc: "Confidential reporting with separate girls and boys wings.", to: "/safety" },
  { icon: LayoutDashboard, title: "Resource Tracking", desc: "Inventory every asset with maintenance history.", to: "/resources" },
  { icon: Search, title: "Lost & Found", desc: "Post, search, verify — reunite items with owners.", to: "/lost-found" },
  { icon: Sparkles, title: "Cleanliness Requests", desc: "Route hygiene issues to the right team fast.", to: "/cleaning" },
  { icon: Bell, title: "Announcements", desc: "Campus-wide notices targeted to the right roles.", to: "/announcements" },
  { icon: Star, title: "Feedback & Ratings", desc: "5-star reviews drive technician performance.", to: "/complaints" },
  { icon: QrCode, title: "QR Reporting", desc: "Scan any resource to auto-fill a complaint.", to: "/resources" },
] as const;


function Landing() {
  const stats = useStats();
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-elevated">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="font-bold tracking-tight">Campus Care</div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#stats" className="hover:text-foreground">Impact</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Smart Campus Management System
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Smart Campus Resource
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Digitize campus maintenance, complaint resolution, cleanliness services and lost &amp; found — all in one modern, secure platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elevated">
                <Link to="/auth">
                  Raise a complaint <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Get started</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div id="stats" className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
            <Counter value={stats.resources} label="Total Resources" />
            <Counter value={stats.users} label="Active Users" />
            <Counter value={stats.solved} label="Complaints Solved" />
            <Counter value={stats.pending} label="Pending Complaints" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything the campus needs</h2>
          <p className="mt-3 text-muted-foreground">
            One workspace for students, teachers, maintenance staff and admins.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:gradient-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{f.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked</h2>
        <div className="mt-10 space-y-3">
          {[
            {
              q: "Who can use CRMCRS?",
              a: "Students, teachers, maintenance staff and campus administrators — each with a purpose-built dashboard.",
            },
            {
              q: "How do QR codes work?",
              a: "Every resource carries a unique QR. Scan it to auto-fill the complaint form with building, room, and asset ID.",
            },
            {
              q: "Is my data secure?",
              a: "Yes — role-based access control, row-level security, and encrypted authentication protect every request.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border bg-card p-5 shadow-soft"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {item.q}
                <MessageSquare className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-12" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div>© {new Date().getFullYear()} Campus Care — Smart Campus Management</div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
