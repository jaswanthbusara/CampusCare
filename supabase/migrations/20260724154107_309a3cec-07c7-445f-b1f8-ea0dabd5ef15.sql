-- Enums
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'staff', 'admin');
CREATE TYPE public.complaint_category AS ENUM (
  'fan','light','projector','computer','printer','ac','desk','chair','bench',
  'lab_equipment','internet','electrical','plumbing','water_cooler','washroom',
  'cleanliness','other'
);
CREATE TYPE public.complaint_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.complaint_status AS ENUM ('submitted','assigned','in_progress','completed','rejected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.complaint_category NOT NULL,
  building TEXT,
  floor TEXT,
  room TEXT,
  priority public.complaint_priority NOT NULL DEFAULT 'medium',
  status public.complaint_status NOT NULL DEFAULT 'submitted',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own complaints" ON public.complaints FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff and admins view all complaints" ON public.complaints FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Users create own complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own submitted complaints" ON public.complaints FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'submitted') WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff and admins update complaints" ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete complaints" ON public.complaints FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_complaints_user ON public.complaints(user_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_assigned ON public.complaints(assigned_to);

-- Complaint images
CREATE TABLE public.complaint_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.complaint_images TO authenticated;
GRANT ALL ON public.complaint_images TO service_role;
ALTER TABLE public.complaint_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View complaint images if can view complaint" ON public.complaint_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND (
    c.user_id = auth.uid() OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
  )));
CREATE POLICY "Insert images for own complaints" ON public.complaint_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND c.user_id = auth.uid()));
CREATE POLICY "Delete own complaint images" ON public.complaint_images FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- Feedback
CREATE TABLE public.complaint_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL UNIQUE REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.complaint_feedback TO authenticated;
GRANT ALL ON public.complaint_feedback TO service_role;
ALTER TABLE public.complaint_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View feedback if can view complaint" ON public.complaint_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert own feedback" ON public.complaint_feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());