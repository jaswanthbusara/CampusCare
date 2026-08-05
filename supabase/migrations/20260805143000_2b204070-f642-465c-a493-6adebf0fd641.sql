CREATE TYPE public.ragging_wing AS ENUM ('girls','boys');
CREATE TYPE public.ragging_status AS ENUM ('pending','under_review','action_taken','resolved','rejected');
CREATE TYPE public.ragging_category AS ENUM ('ragging','harassment','bullying','cyber_bullying','physical_abuse','verbal_abuse','other');

CREATE TABLE public.ragging_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wing public.ragging_wing NOT NULL,
  category public.ragging_category NOT NULL DEFAULT 'ragging',
  title text NOT NULL,
  description text NOT NULL,
  building text,
  floor text,
  room text,
  incident_date date,
  is_anonymous boolean NOT NULL DEFAULT false,
  severity text NOT NULL DEFAULT 'medium',
  status public.ragging_status NOT NULL DEFAULT 'pending',
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ragging_reports TO authenticated;
GRANT ALL ON public.ragging_reports TO service_role;

ALTER TABLE public.ragging_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own ragging reports" ON public.ragging_reports
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own ragging reports" ON public.ragging_reports
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own pending ragging reports" ON public.ragging_reports
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'pending') WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff and admins view all ragging reports" ON public.ragging_reports
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff and admins update ragging reports" ON public.ragging_reports
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete ragging reports" ON public.ragging_reports
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_ragging_reports_updated_at
  BEFORE UPDATE ON public.ragging_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ragging_reports_wing_status ON public.ragging_reports (wing, status);