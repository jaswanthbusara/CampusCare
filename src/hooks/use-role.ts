import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "teacher" | "staff" | "admin";

const PRIORITY: AppRole[] = ["admin", "staff", "teacher", "student"];

export function useRole() {
  const query = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [] as AppRole[];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      return (data ?? []).map((r) => r.role as AppRole);
    },
    staleTime: 5 * 60 * 1000,
  });

  const roles = query.data ?? [];
  const role = PRIORITY.find((r) => roles.includes(r)) ?? "student";
  return {
    roles,
    role,
    isStaff: roles.includes("staff") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
    loading: query.isLoading,
  };
}
