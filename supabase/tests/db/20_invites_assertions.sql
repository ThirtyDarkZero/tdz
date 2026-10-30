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

-- Automatic lyrics ------------------------------------------------------------
INSERT INTO tracks (id, user_id, title) VALUES ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'Song');
SELECT pg_temp.check((SELECT status FROM lyrics_jobs WHERE track_id = '00000000-0000-4000-8000-0000000000d1') = 'pending',
  'a new track gets a lyrics job');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$UPDATE lyrics_jobs SET proxy_path = 'u/lyrics-proxy/d1.wav' WHERE track_id = '00000000-0000-4000-8000-0000000000d1' RETURNING 'ok'$q$) = 'ok',
  'owner can attach the small audio copy');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$UPDATE lyrics_jobs SET status = 'done' WHERE track_id = '00000000-0000-4000-8000-0000000000d1' RETURNING status$q$) IS DISTINCT FROM 'done',
  'owner cannot mark the job done themselves');
SELECT pg_temp.check((SELECT proxy_path FROM lyrics_jobs WHERE track_id = '00000000-0000-4000-8000-0000000000d1') = 'u/lyrics-proxy/d1.wav',
  'the audio copy path is kept');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    $q$SELECT count(*)::text FROM lyrics_jobs$q$) = '0',
  'others cannot see lyrics jobs');
SELECT pg_temp.check(EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-lyrics-sweep'), 'retry sweep is scheduled');

-- Pre-save ----------------------------------------------------------------------
INSERT INTO presave_campaigns (user_id, campaign_name, slug, release_date)
VALUES ('00000000-0000-4000-8000-0000000000a1', 'Next Single', 'next-single', current_date + 7);
SET ROLE anon;
SELECT pg_temp.check(public.presave_signup('next-single', ' Fan@Example.com ') = 'joined', 'a fan pre-saves without an account');
SELECT pg_temp.check(public.presave_signup('NEXT-SINGLE', 'fan@example.com') = 'already', 'the same fan is counted once');
RESET ROLE;
DO $$ BEGIN
  PERFORM public.presave_signup('next-single', 'not-an-email');
  RAISE EXCEPTION 'FAILED: bad email accepted';
EXCEPTION WHEN invalid_parameter_value THEN RAISE NOTICE 'ok: bad emails are rejected';
END $$;
SELECT pg_temp.check((SELECT total_presaves FROM presave_campaigns WHERE slug = 'next-single') = 1, 'pre-save count is right');
SELECT pg_temp.check(EXISTS (SELECT 1 FROM artist_contacts WHERE artist_id = '00000000-0000-4000-8000-0000000000a1'
  AND email = 'fan@example.com' AND subscribed AND 'presave:next-single' = ANY (tags)), 'the fan joins the artist''s email list');

-- Splits pipeline ------------------------------------------------------------------
INSERT INTO tracks (id, user_id, title, credits) VALUES ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', 'Co-write',
  '{"writers":[{"name":"Nova Reign","role":"writer"},{"name":"Kay","role":"writer","email":"Kay@Pen.co"},{"name":"Jo","role":"writer"}]}');
SELECT pg_temp.check((SELECT count(*) = 3 AND sum(split_percentage) = 100 FROM track_rights_splits
  WHERE track_id = '00000000-0000-4000-8000-0000000000e1' AND rights_type = 'publishing'),
  'writers from upload become publishing splits that add to 100%');
SELECT pg_temp.check((SELECT holder_email FROM track_rights_splits WHERE holder_name = 'Kay') = 'kay@pen.co', 'writer emails are kept');

-- The artist can't self-confirm a collaborator.
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$UPDATE track_rights_splits SET status = 'confirmed' WHERE holder_name = 'Kay' RETURNING status$q$) LIKE 'ERROR:%',
  'artist cannot mark a collaborator as confirmed');

-- Collaborator confirms from the link (no account needed).
UPDATE track_rights_splits SET status = 'sent', sent_at = now() WHERE holder_name = 'Kay';
SELECT pg_temp.check((SELECT holder_name || ':' || track_title FROM get_split_by_token((SELECT token FROM track_rights_splits WHERE holder_name = 'Kay')))
  = 'Kay:Co-write', 'the link shows the split');
CREATE TEMP TABLE kay_tok AS SELECT token FROM track_rights_splits WHERE holder_name = 'Kay';
GRANT SELECT ON kay_tok TO anon;
SET ROLE anon;
SELECT pg_temp.check(public.respond_to_split((SELECT token FROM kay_tok), true) = 'confirmed',
  'collaborator confirms');
RESET ROLE;
SELECT pg_temp.check((SELECT is_verified FROM track_rights_splits WHERE holder_name = 'Kay'), 'confirmed split is verified');

-- Changing a confirmed share sends it back for confirmation and kills the old link.
CREATE TEMP TABLE old_tok AS SELECT token FROM track_rights_splits WHERE holder_name = 'Kay';
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$UPDATE track_rights_splits SET split_percentage = 20 WHERE holder_name = 'Kay' RETURNING status$q$) = 'draft',
  'changing a confirmed share resets it to draft');
SELECT pg_temp.check((SELECT token FROM track_rights_splits WHERE holder_name = 'Kay') <> (SELECT token FROM old_tok),
  'old confirmation links stop working');

-- Dispute with a note.
SELECT pg_temp.check(public.respond_to_split((SELECT token FROM track_rights_splits WHERE holder_name = 'Jo'), false, 'I wrote the hook') = 'disputed',
  'collaborator can dispute');

-- Overview and copy to other tracks.
INSERT INTO tracks (id, user_id, title) VALUES ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000a1', 'Track 2');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$SELECT copy_splits('00000000-0000-4000-8000-0000000000e1', ARRAY['00000000-0000-4000-8000-0000000000e2']::uuid[])::text$q$) = '3',
  'splits copy to another track on the release');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a1', 'artist@tdz.test',
    $q$SELECT string_agg(total::text || '/' || holders || '/' || confirmed || '/' || disputed, ',') FROM split_overview() WHERE track_id = '00000000-0000-4000-8000-0000000000e1'$q$)
    = '86.67/3/0/1',
  'overview shows totals, confirmations and disputes');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    $q$SELECT count(*)::text FROM split_overview()$q$) = '0',
  'others see no split overview');
SELECT pg_temp.check(
  pg_temp.as_user('00000000-0000-4000-8000-0000000000a4', 'stranger@tdz.test',
    $q$SELECT copy_splits('00000000-0000-4000-8000-0000000000e1', ARRAY['00000000-0000-4000-8000-0000000000e2']::uuid[])::text$q$) LIKE 'ERROR:%',
  'others cannot copy splits');
