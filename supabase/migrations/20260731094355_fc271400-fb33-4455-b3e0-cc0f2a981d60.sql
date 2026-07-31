-- Remove self-referencing admin policies on user_roles to avoid recursion once has_role is invoker
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- has_role no longer needs elevated privileges: users can read their own roles via RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$function$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
