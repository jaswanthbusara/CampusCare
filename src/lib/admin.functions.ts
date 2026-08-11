import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns whether any admin exists. Admin-bootstrap helpers are no longer
 *  callable directly from the browser; they run server-side only. */
export const adminExists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("admin_exists");
    if (error) throw new Error("Unable to check admin status");
    return Boolean(data);
  });

/** Grants the calling (authenticated) user the admin role, but only when no
 *  admin exists yet. The user id comes from the verified bearer token. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: checkError } = await supabaseAdmin.rpc("admin_exists");
    if (checkError) throw new Error("Unable to check admin status");
    if (existing) return false;

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error("Unable to claim admin role");
    return true;
  });
