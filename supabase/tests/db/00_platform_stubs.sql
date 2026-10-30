-- Minimal stand-ins for Supabase platform pieces so migrations run on plain Postgres.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
END $$;
CREATE SCHEMA auth;
CREATE TABLE auth._session (uid uuid, role text, email text);
INSERT INTO auth._session VALUES (NULL, 'service_role');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT uid FROM auth._session $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT role FROM auth._session $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('email', email, 'role', role) FROM auth._session $$;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE TYPE public.app_role AS ENUM ('admin', 'ceo', 'artist', 'user');
CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE SCHEMA cron;
CREATE TABLE cron.job (jobid serial, jobname text, schedule text, command text);
CREATE FUNCTION cron.schedule(n text, s text, c text) RETURNS int LANGUAGE sql AS
  $$ INSERT INTO cron.job (jobname, schedule, command) VALUES (n, s, c) RETURNING jobid $$;
CREATE FUNCTION cron.unschedule(n text) RETURNS boolean LANGUAGE sql AS $$ DELETE FROM cron.job WHERE jobname = n RETURNING true $$;
CREATE SCHEMA vault; CREATE TABLE vault.decrypted_secrets (name text, decrypted_secret text);
CREATE SCHEMA extensions;
