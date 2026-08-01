-- Close privilege escalation: a manager could self-insert any artist into their roster
-- and thereby gain edit/delete rights on that artist's tracks, albums and storage files.
DROP POLICY IF EXISTS "Managers can add artists" ON public.manager_artists;

-- Only the artist can create the relationship themselves. All other rows must come
-- from the SECURITY DEFINER invite-acceptance trigger (which bypasses RLS).
CREATE POLICY "Artists can add their own manager"
ON public.manager_artists
FOR INSERT
TO authenticated
WITH CHECK (artist_id = auth.uid());

-- Managers must not be able to repoint an existing row at a different artist.
DROP POLICY IF EXISTS "Managers can update their artists" ON public.manager_artists;
CREATE POLICY "Roster rows updatable by both parties"
ON public.manager_artists
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid() OR artist_id = auth.uid())
WITH CHECK (
  manager_id = (SELECT ma.manager_id FROM public.manager_artists ma WHERE ma.id = manager_artists.id)
  AND artist_id = (SELECT ma.artist_id FROM public.manager_artists ma WHERE ma.id = manager_artists.id)
);

-- The artist must also be able to revoke a manager.
DROP POLICY IF EXISTS "Managers can remove artists" ON public.manager_artists;
CREATE POLICY "Either party can end the relationship"
ON public.manager_artists
FOR DELETE
TO authenticated
USING (manager_id = auth.uid() OR artist_id = auth.uid());