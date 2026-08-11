DROP VIEW IF EXISTS public.lost_item_contacts;
DROP VIEW IF EXISTS public.ragging_report_reporters;

-- Lost & Found contact details in their own protected table
CREATE TABLE public.lost_item_contacts (
  item_id uuid PRIMARY KEY REFERENCES public.lost_items(id) ON DELETE CASCADE,
  contact_info text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_item_contacts TO authenticated;
GRANT ALL ON public.lost_item_contacts TO service_role;
ALTER TABLE public.lost_item_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner staff admin view contacts" ON public.lost_item_contacts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.lost_items li WHERE li.id = item_id
  AND (li.user_id = auth.uid() OR public.has_role(auth.uid(),'staff') OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Owner inserts contact" ON public.lost_item_contacts FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.lost_items li WHERE li.id = item_id AND li.user_id = auth.uid()));
CREATE POLICY "Owner updates contact" ON public.lost_item_contacts FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.lost_items li WHERE li.id = item_id AND li.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.lost_items li WHERE li.id = item_id AND li.user_id = auth.uid()));
CREATE POLICY "Owner or admin deletes contact" ON public.lost_item_contacts FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.lost_items li WHERE li.id = item_id
  AND (li.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

INSERT INTO public.lost_item_contacts (item_id, contact_info)
SELECT id, contact_info FROM public.lost_items WHERE contact_info IS NOT NULL;
ALTER TABLE public.lost_items DROP COLUMN contact_info;
GRANT SELECT ON public.lost_items TO authenticated;

-- Ragging reports: reporter identity only for non-anonymous reports
CREATE TABLE public.ragging_report_identities (
  report_id uuid PRIMARY KEY REFERENCES public.ragging_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ragging_report_identities TO authenticated;
GRANT ALL ON public.ragging_report_identities TO service_role;
ALTER TABLE public.ragging_report_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff admin view reporter identity" ON public.ragging_report_identities FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'staff') OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.record_ragging_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_anonymous = false THEN
    INSERT INTO public.ragging_report_identities (report_id, user_id)
    VALUES (NEW.id, NEW.user_id) ON CONFLICT (report_id) DO UPDATE SET user_id = EXCLUDED.user_id;
  ELSE
    DELETE FROM public.ragging_report_identities WHERE report_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.record_ragging_identity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_ragging_identity AFTER INSERT OR UPDATE OF is_anonymous ON public.ragging_reports
FOR EACH ROW EXECUTE FUNCTION public.record_ragging_identity();

INSERT INTO public.ragging_report_identities (report_id, user_id)
SELECT id, user_id FROM public.ragging_reports WHERE is_anonymous = false
ON CONFLICT (report_id) DO NOTHING;

-- Admin bootstrap helpers are no longer directly callable by signed-in users
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon, authenticated;