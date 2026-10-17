-- Prepared from the CoreCTRL schema snapshot. NOT APPLIED by this library project.
-- Apply in the shared backend only after reviewing existing company RLS/admin permissions.
BEGIN;

ALTER TABLE public.company ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.is_company_active(_user_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(
    (SELECT c.is_active
     FROM public.profiles p JOIN public.company c ON c.id = p.company_id
     WHERE p.id = COALESCE(_user_id, auth.uid())
       AND (COALESCE(_user_id, auth.uid()) = auth.uid()
            OR public.is_super_admin(auth.uid()))), false)
$$;
REVOKE ALL ON FUNCTION public.is_company_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_active(uuid) TO authenticated, service_role;

-- Only suite Super Admins (or privileged server maintenance) can suspend/reactivate a company.
CREATE OR REPLACE FUNCTION public.guard_company_is_active()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_active IS DISTINCT FROM true
       AND COALESCE(auth.role(), '') <> 'service_role'
       AND NOT COALESCE(public.is_super_admin(auth.uid()), false) THEN
      RAISE EXCEPTION 'Only Super Admins can change company status';
    END IF;
  ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT COALESCE(public.is_super_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Only Super Admins can change company status';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_company_is_active() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_company_is_active ON public.company;
CREATE TRIGGER trg_guard_company_is_active BEFORE INSERT OR UPDATE ON public.company
FOR EACH ROW EXECUTE FUNCTION public.guard_company_is_active();

-- Older consumer libraries already call this: company suspension also blocks them at login.
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE((SELECT p.is_active FROM public.profiles p
    WHERE p.id = COALESCE(_user_id, auth.uid())), false)
    AND public.is_company_active(_user_id)
$$;
REVOKE ALL ON FUNCTION public.is_user_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_user_access_app(_app text, _user_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _caller uuid := auth.uid();
  _target uuid := COALESCE(_user_id, auth.uid());
BEGIN
  IF _caller IS NULL OR _target IS NULL THEN RETURN false; END IF;
  IF _target <> _caller AND NOT COALESCE(public.is_super_admin(_caller), false) THEN RETURN false; END IF;
  IF NOT public.is_user_active(_target) THEN RETURN false; END IF;
  IF public.is_super_admin(_target) THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.clients c ON c.company_id = p.company_id
    JOIN public.client_apps ca ON ca.client_id = c.id
    WHERE p.id = _target AND ca.app::text = _app AND ca.enabled = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_clients uc
    JOIN public.clients c ON c.id = uc.client_id
    JOIN public.company co ON co.id = c.company_id
    JOIN public.client_apps ca ON ca.client_id = uc.client_id
    WHERE uc.user_id = _target AND co.is_active = true
      AND ca.app::text = _app AND ca.enabled = true
  );
END;
$$;
REVOKE ALL ON FUNCTION public.can_user_access_app(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_user_access_app(text, uuid) TO authenticated, service_role;

COMMIT;

-- REQUIRED FOLLOW-UP: add a RESTRICTIVE authenticated policy on each tenant-data table
-- and relevant storage.objects policies, alongside existing tenant/ownership policies:
-- CREATE POLICY company_active_gate ON public.<reviewed_table> AS RESTRICTIVE
-- FOR ALL TO authenticated USING (public.is_user_active(auth.uid()))
-- WITH CHECK (public.is_user_active(auth.uid()));
-- Inventory policies first. Do not apply blindly to password/profile bootstrap or admin recovery paths.
-- Privileged server endpoints bypass RLS and must perform their own company checks.