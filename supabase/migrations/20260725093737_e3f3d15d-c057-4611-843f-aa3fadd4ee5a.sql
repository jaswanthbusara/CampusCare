
CREATE TYPE public.lost_item_type AS ENUM ('lost', 'found');
CREATE TYPE public.lost_item_status AS ENUM ('open', 'claimed', 'resolved', 'closed');

CREATE TABLE public.lost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.lost_item_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  occurred_on DATE,
  contact_info TEXT,
  image_path TEXT,
  status public.lost_item_status NOT NULL DEFAULT 'open',
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_items TO authenticated;
GRANT ALL ON public.lost_items TO service_role;

ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view lost items"
  ON public.lost_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own lost items"
  ON public.lost_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or staff can update"
  ON public.lost_items FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owner or admin can delete"
  ON public.lost_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_lost_items_updated_at
  BEFORE UPDATE ON public.lost_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX lost_items_type_status_idx ON public.lost_items(type, status, created_at DESC);
CREATE INDEX lost_items_user_idx ON public.lost_items(user_id);
