import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  })

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const weekLabel = `Week of ${new Date(since).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`

  const results: Record<string, unknown>[] = []

  try {
    // Artists with activity in the last 7 days
    const { data: events, error: evErr } = await admin
      .from('stream_events')
      .select('artist_id, track_id, listener_id')
      .gte('streamed_at', since)
      .limit(50000)

    if (evErr) throw evErr

    const byArtist = new Map<
      string,
      { plays: number; listeners: Set<string>; tracks: Map<string, number> }
    >()

    for (const e of events ?? []) {
      if (!e.artist_id) continue
      const entry =
        byArtist.get(e.artist_id) ??
        { plays: 0, listeners: new Set<string>(), tracks: new Map<string, number>() }
      entry.plays += 1
      if (e.listener_id) entry.listeners.add(e.listener_id)
      if (e.track_id) entry.tracks.set(e.track_id, (entry.tracks.get(e.track_id) ?? 0) + 1)
      byArtist.set(e.artist_id, entry)
    }

    for (const [artistId, agg] of byArtist) {
      // Resolve recipient
      const { data: authUser } = await admin.auth.admin.getUserById(artistId)
      const email = authUser?.user?.email
      if (!email) continue

      // Resolve display name
      const { data: profile } = await admin
        .from('artist_profiles')
        .select('artist_name')
        .eq('user_id', artistId)
        .maybeSingle()

      // Top tracks
      const topIds = [...agg.tracks.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      let topTracks: { title: string; plays: number }[] = []
      if (topIds.length) {
        const { data: trackRows } = await admin
          .from('tracks')
          .select('id, title')
          .in('id', topIds.map(([id]) => id))
        const titleById = new Map((trackRows ?? []).map((t) => [t.id, t.title]))
        topTracks = topIds.map(([id, plays]) => ({
          title: titleById.get(id) ?? 'Untitled',
          plays,
        }))
      }

      // New follows this week
      const { count: newFollowers } = await admin
        .from('artist_follows')
        .select('id', { count: 'exact', head: true })
        .eq('artist_id', artistId)
        .gte('created_at', since)

      const payload = {
        templateName: 'weekly-stats',
        recipientEmail: email,
        idempotencyKey: `weekly-stats-${artistId}-${since.slice(0, 10)}`,
        templateData: {
          name: profile?.artist_name ?? email.split('@')[0],
          plays: agg.plays,
          earnings: agg.plays, // $1 per intentional play
          listeners: agg.listeners.size,
          newFollowers: newFollowers ?? 0,
          topTracks,
          weekLabel,
        },
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE}`,
          apikey: SERVICE_ROLE,
        },
        body: JSON.stringify(payload),
      })

      results.push({ artistId, status: res.status })
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length, results }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('weekly-artist-stats-email failed', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
