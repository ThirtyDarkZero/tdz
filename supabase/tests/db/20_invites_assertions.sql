-- Team and roster invites.
\set ON_ERROR_STOP on
CREATE OR REPLACE FUNCTION pg_temp.check(ok boolean, what text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS NOT TRUE THEN RAISE EXCEPTION 'FAILED: %', what; END IF;
  RAISE NOTICE 'ok: %', what;
END $$;
SET client_min_messages = notice;
-- Run a statement as a signed-in user and report whether it raised.
CREATE OR REPLACE FUNCTION pg_temp.as_user(uid uuid, email text, stmt text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE r text;
BEGIN
  UPDATE auth._session SET uid = as_user.uid, role = 'authenticated', email = as_user.email;
  BEGIN
    EXECUTE 'SET LOCAL ROLE authenticated';
    EXECUTE stmt INTO r;
    EXECUTE 'RESET ROLE';
  EXCEPTION WHEN others THEN
    EXECUTE 'RESET ROLE';
    r := 'ERROR: ' || SQLERRM;
  END;
  UPDATE auth._session SET uid = NULL, role = 'service_role', email = NULL;
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION pg_temp.check(boolean, text) TO authenticated;

-- People
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test'),
  ('00000000-0000-4000-8000-0000000000a2', 'producer@tdz.test'),
  ('00000000-0000-4000-8000-0000000000a3', 'manager@tdz.test'),
  ('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test');
INSERT INTO artist_profiles VALUES ('00000000-0000-4000-8000-0000000000a1', 'Nova Reign');

-- Server creates invites (send-team-invite runs as service role).
INSERT INTO collaborator_invites (artist_id, invited_email, permissions, kind, token)
VALUES ('00000000-0000-4000-8000-0000000000a1', 'Producer@TDZ.test', '["view_tracks","edit_tracks"]', 'collaborator',
        '00000000-0000-4000-8000-00000000c001');
INSERT INTO collaborator_invites (artist_id, invited_email, permissions, kind, token)
VALUES ('00000000-0000-4000-8000-0000000000a3', 'artist@tdz.test', '{"manager":true}', 'roster',
        '00000000-0000-4000-8000-00000000c002');

SELECT pg_temp.check(
  (SELECT count(*) FROM collaborator_invites WHERE lower(invited_email) = 'producer@tdz.test' AND kind = 'collaborator') = 1,
  'invite saved');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a2', 'producer@tdz.test',
    'SELECT count(*)::text FROM collaborator_invites') = '1',
  'invitee can see their invite (previously: permission denied for table users)');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    'SELECT count(*)::text FROM collaborator_invites') = '0',
  'others cannot see it');
SELECT pg_temp.check(
  (SELECT inviter_name FROM get_invite_by_token('00000000-0000-4000-8000-00000000c001')) = 'Nova Reign',
  'invite preview by token shows who invited you');

-- Duplicate open invites are blocked (re-send refreshes instead).
DO $$ BEGIN
  INSERT INTO collaborator_invites (artist_id, invited_email, kind) VALUES ('00000000-0000-4000-8000-0000000000a1', 'producer@tdz.test', 'collaborator');
  RAISE EXCEPTION 'FAILED: duplicate open invite allowed';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'ok: only one open invite per person';
END $$;

-- Wrong person cannot accept.
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    $q$SELECT respond_to_invite('00000000-0000-4000-8000-00000000c001', true)$q$) LIKE 'ERROR: This invite was sent to%',
  'someone else cannot accept the invite');

-- Invitee accepts (previously blocked by the artist_collaborators policy).
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a2', 'producer@tdz.test',
    $q$SELECT respond_to_invite('00000000-0000-4000-8000-00000000c001', true)$q$) = 'accepted',
  'invitee accepts');
SELECT pg_temp.check(
  (SELECT permissions = '["view_tracks","edit_tracks"]'::jsonb FROM artist_collaborators
   WHERE artist_id = '00000000-0000-4000-8000-0000000000a1' AND collaborator_id = '00000000-0000-4000-8000-0000000000a2'),
  'collaborator gets the invited permissions');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a2', 'producer@tdz.test',
    $q$SELECT respond_to_invite('00000000-0000-4000-8000-00000000c001', false)$q$) = 'accepted',
  'answering twice changes nothing');

-- Roster invite links the manager to the artist.
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$SELECT respond_to_invite('00000000-0000-4000-8000-00000000c002', true)$q$) = 'accepted',
  'artist accepts a roster invite');
SELECT pg_temp.check(
  EXISTS (SELECT 1 FROM manager_artists WHERE manager_id = '00000000-0000-4000-8000-0000000000a3'
          AND artist_id = '00000000-0000-4000-8000-0000000000a1'),
  'manager now manages the artist');
SELECT pg_temp.check(
  NOT EXISTS (SELECT 1 FROM artist_collaborators WHERE artist_id = '00000000-0000-4000-8000-0000000000a3'),
  'roster invite does not create a stray collaborator row');

-- Declining works (previously the status value was rejected).
INSERT INTO collaborator_invites (artist_id, invited_email, kind, token)
VALUES ('00000000-0000-4000-8000-0000000000a1', 'stranger@tdz.test', 'collaborator', '00000000-0000-4000-8000-00000000c003');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    $q$SELECT respond_to_invite('00000000-0000-4000-8000-00000000c003', false)$q$) = 'declined',
  'invitee declines');

-- Expired invites can't be accepted.
INSERT INTO collaborator_invites (artist_id, invited_email, kind, token, expires_at)
VALUES ('00000000-0000-4000-8000-0000000000a3', 'producer@tdz.test', 'roster', '00000000-0000-4000-8000-00000000c004', now() - interval '1 day');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a2', 'producer@tdz.test',
    $q$SELECT respond_to_invite('00000000-0000-4000-8000-00000000c004', true)$q$) = 'expired',
  'expired invite cannot be accepted');

-- Invitees still can't rewrite an invite directly.
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a2', 'producer@tdz.test',
    $q$UPDATE collaborator_invites SET permissions = '["delete_tracks"]' WHERE token = '00000000-0000-4000-8000-00000000c004' RETURNING 'changed'$q$)
    IS DISTINCT FROM 'changed',
  'invitee cannot change permissions');
SELECT pg_temp.check(NOT has_function_privilege('anon', 'public.respond_to_invite(uuid,boolean)', 'execute'),
  'signed-out visitors cannot respond to invites');

-- Smart links ----------------------------------------------------------------
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$INSERT INTO smart_links (user_id, short_code, title, platforms) VALUES
       ('00000000-0000-4000-8000-0000000000a1', 'my-single', 'My Single', '{"Spotify":"https://open.spotify.com/x"}') RETURNING 'ok'$q$) = 'ok',
  'artist creates a link with only outside platforms (previously failed)');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$INSERT INTO smart_links (user_id, short_code, title) VALUES
       ('00000000-0000-4000-8000-0000000000a1', 'empty-link', 'Nowhere') RETURNING 'ok'$q$) LIKE 'ERROR:%',
  'a link must go somewhere');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$INSERT INTO smart_links (user_id, short_code, title, platforms) VALUES
       ('00000000-0000-4000-8000-0000000000a1', 'bad code!', 'x', '{"A":"https://a.b"}') RETURNING 'ok'$q$) LIKE 'ERROR:%',
  'link names are URL-safe');
UPDATE auth._session SET role = 'anon';
SET ROLE anon;
SELECT record_smart_link_click('MY-SINGLE', 'view');
SELECT record_smart_link_click('my-single', 'Spotify');
SELECT record_smart_link_click('my-single', 'Spotify');
SELECT record_smart_link_click('no-such-link', 'Spotify');
RESET ROLE;
UPDATE auth._session SET role = 'service_role';
SELECT pg_temp.check((SELECT clicks FROM smart_links WHERE short_code = 'my-single') = 2,
  'outbound clicks are counted, page views are not');
SELECT pg_temp.check((SELECT count(*) FROM smart_link_clicks) = 3, 'every visit is logged');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$SELECT string_agg(platform || '=' || clicks, ',' ORDER BY platform) FROM smart_link_stats((SELECT id FROM smart_links WHERE short_code = 'my-single'))$q$)
    = 'Spotify=2,view=1',
  'owner sees clicks per platform');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    $q$SELECT count(*)::text FROM smart_link_stats((SELECT id FROM smart_links WHERE short_code = 'my-single'))$q$) = '0',
  'others cannot see link stats');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    $q$DELETE FROM smart_links WHERE short_code = 'my-single' RETURNING 'gone'$q$) IS DISTINCT FROM 'gone',
  'others cannot delete a link');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$DELETE FROM smart_links WHERE short_code = 'my-single' RETURNING 'gone'$q$) = 'gone',
  'owner can delete their link');
