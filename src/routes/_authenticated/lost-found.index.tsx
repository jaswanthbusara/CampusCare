import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Plus, Search, PackageSearch } from "lucide-react";

export const Route = createFileRoute("/_authenticated/lost-found/")({
  component: LostFoundList,
  head: () => ({ meta: [{ title: "Lost & Found — CRMCRS" }] }),
});

type Item = {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string | null;
  occurred_on: string | null;
  status: "open" | "claimed" | "resolved" | "closed";
  image_path: string | null;
  created_at: string;
  user_id: string;
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  claimed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground",
};

function LostFoundList() {
  const [tab, setTab] = useState<"all" | "lost" | "found">("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lost_items")
        .select("id,type,title,description,category,location,occurred_on,status,image_path,created_at,user_id")
        .order("created_at", { ascending: false })
        .limit(100);
      const list = (data ?? []) as Item[];
      setItems(list);

      const paths = list.map((i) => i.image_path).filter(Boolean) as string[];
      if (paths.length) {
        const { data: signed } = await supabase.storage
          .from("lost-found-images")
          .createSignedUrls(paths, 60 * 60);
        const map: Record<string, string> = {};
        signed?.forEach((s, idx) => {
          if (s.signedUrl) map[paths[idx]] = s.signedUrl;
        });
        setUrls(map);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== "all" && i.type !== tab) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, tab, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lost &amp; Found</h1>
          <p className="text-sm text-muted-foreground">
            Report a lost item or help return something found on campus.
          </p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground">
          <Link to="/lost-found/new">
            <Plus className="mr-1.5 h-4 w-4" /> Report item
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
            <TabsTrigger value="found">Found</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, category, place..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border bg-card py-20 text-center">
          <PackageSearch className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No items yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Be the first to post — help reunite belongings with their owners.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <article
              key={i.id}
              className="group overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-md"
            >
              <div className="relative h-40 w-full overflow-hidden bg-muted">
                {i.image_path && urls[i.image_path] ? (
                  <img
                    src={urls[i.image_path]}
                    alt={i.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <PackageSearch className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                  <Badge
                    className={
                      i.type === "lost"
                        ? "bg-rose-500/90 text-white hover:bg-rose-500/90"
                        : "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
                    }
                  >
                    {i.type === "lost" ? "Lost" : "Found"}
                  </Badge>
                  <Badge variant="outline" className={`capitalize ${statusColors[i.status] ?? ""}`}>
                    {i.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <div>
                  <h3 className="line-clamp-1 font-semibold">{i.title}</h3>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {i.category.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{i.description}</p>
                {i.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{i.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(i.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
