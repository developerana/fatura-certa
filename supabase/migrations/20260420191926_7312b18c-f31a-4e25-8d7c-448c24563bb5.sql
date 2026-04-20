-- Add username and password_changed_at to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone;

-- Backfill username from email local-part for existing users (slugified, unique)
DO $$
DECLARE
  rec RECORD;
  base_username text;
  candidate text;
  counter int;
BEGIN
  FOR rec IN
    SELECT p.id, p.user_id, u.email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.username IS NULL OR p.username = ''
  LOOP
    base_username := lower(regexp_replace(split_part(COALESCE(rec.email, ''), '@', 1), '[^a-z0-9_]+', '', 'g'));
    IF base_username IS NULL OR length(base_username) < 3 THEN
      base_username := 'user' || substr(rec.user_id::text, 1, 8);
    END IF;
    candidate := base_username;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
      counter := counter + 1;
      candidate := base_username || counter::text;
    END LOOP;
    UPDATE public.profiles SET username = candidate WHERE id = rec.id;
  END LOOP;
END $$;

-- Make username NOT NULL and unique going forward
ALTER TABLE public.profiles
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (lower(username));

-- Validation: username format (3-30 chars, lowercase letters/numbers/underscore)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_chk
  CHECK (username ~ '^[a-z0-9_]{3,30}$');

-- Update handle_new_user to also create username from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username text;
  candidate text;
  counter int;
BEGIN
  base_username := lower(regexp_replace(split_part(COALESCE(NEW.email, ''), '@', 1), '[^a-z0-9_]+', '', 'g'));
  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user' || substr(NEW.id::text, 1, 8);
  END IF;
  candidate := base_username;
  counter := 1;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    counter := counter + 1;
    candidate := base_username || counter::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), candidate);
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users for handle_new_user and handle_new_user_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_role'
  ) THEN
    CREATE TRIGGER on_auth_user_created_role
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
  END IF;
END $$;

-- Function: lookup user_id by username (SECURITY DEFINER, no email exposure)
-- The edge function will use service role to look up the email; we keep this RPC
-- for client-side username availability checks.
CREATE OR REPLACE FUNCTION public.is_username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;
