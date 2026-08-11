-- 1. Move is_admin out of the exposed API schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'); $$;
REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all profiles v2" ON public.profiles;

CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()) AND NOT (user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()));
CREATE POLICY "Admins view all profiles v2" ON public.profiles FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()));

DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- 2. lost_items: hide contact_info from general readers
REVOKE SELECT ON public.lost_items FROM authenticated;
GRANT SELECT (id, user_id, type, title, description, category, location, occurred_on,
              image_path, status, claimed_by, claimed_at, created_at, updated_at)
  ON public.lost_items TO authenticated;

CREATE OR REPLACE VIEW public.lost_item_contacts AS
  SELECT li.id, li.contact_info
  FROM public.lost_items li
  WHERE li.user_id = auth.uid()
     OR public.has_role(auth.uid(), 'staff')
     OR private.is_admin(auth.uid());
REVOKE ALL ON public.lost_item_contacts FROM PUBLIC, anon;
GRANT SELECT ON public.lost_item_contacts TO authenticated;

-- 3. ragging_reports: enforce anonymity at the data layer
REVOKE SELECT ON public.ragging_reports FROM authenticated;
GRANT SELECT (id, wing, category, title, description, building, floor, room, incident_date,
              is_anonymous, severity, status, remarks, created_at, updated_at)
  ON public.ragging_reports TO authenticated;

CREATE OR REPLACE VIEW public.ragging_report_reporters AS
  SELECT r.id, r.user_id
  FROM public.ragging_reports r
  WHERE r.is_anonymous = false
    AND (public.has_role(auth.uid(), 'staff') OR private.is_admin(auth.uid()));
REVOKE ALL ON public.ragging_report_reporters FROM PUBLIC, anon;
GRANT SELECT ON public.ragging_report_reporters TO authenticated;