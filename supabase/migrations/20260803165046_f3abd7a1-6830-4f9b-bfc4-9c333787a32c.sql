-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience app_role[],
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View announcements for my audience" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    audience IS NULL
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (audience))
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "Staff and admins create announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Staff and admins update announcements" ON public.announcements
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff and admins delete announcements" ON public.announcements
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RESOURCES (QR)
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category complaint_category NOT NULL DEFAULT 'other',
  building text,
  floor text,
  room text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view resources" ON public.resources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff and admins create resources" ON public.resources
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff and admins update resources" ON public.resources
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete resources" ON public.resources
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CLEANING REQUESTS
CREATE TYPE public.cleaning_status AS ENUM ('pending','scheduled','in_progress','completed','rejected');

CREATE TABLE public.cleaning_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  building text NOT NULL,
  floor text,
  room text,
  area_type text NOT NULL DEFAULT 'classroom',
  description text NOT NULL,
  urgency complaint_priority NOT NULL DEFAULT 'medium',
  status cleaning_status NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_for timestamptz,
  completed_at timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_requests TO authenticated;
GRANT ALL ON public.cleaning_requests TO service_role;
ALTER TABLE public.cleaning_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cleaning requests" ON public.cleaning_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff and admins view all cleaning requests" ON public.cleaning_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Users create own cleaning requests" ON public.cleaning_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own pending cleaning requests" ON public.cleaning_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending'::cleaning_status)
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff and admins update cleaning requests" ON public.cleaning_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete cleaning requests" ON public.cleaning_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cleaning_requests_updated_at BEFORE UPDATE ON public.cleaning_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();