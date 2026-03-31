import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Fetch all artists with autopilot enabled
    const { data: pilots, error: pilotErr } = await supabaseAdmin
      .from('artist_autopilot')
      .select('*')
      .eq('is_enabled', true);

    if (pilotErr) throw pilotErr;
    if (!pilots || pilots.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No active autopilots" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    for (const pilot of pilots) {
      const userId = pilot.user_id;
      const taskResults: string[] = [];

      // --- 1. Auto-publish scheduled releases ---
      if (pilot.auto_publish_releases) {
        try {
          const { data: albums } = await supabaseAdmin
            .from('albums')
            .select('id, title, scheduled_release_date')
            .eq('user_id', userId)
            .eq('is_published', false)
            .not('scheduled_release_date', 'is', null);

          const now = new Date();
          let published = 0;
          for (const album of (albums || [])) {
            if (album.scheduled_release_date && new Date(album.scheduled_release_date) <= now) {
              await supabaseAdmin.from('albums').update({ is_published: true }).eq('id', album.id);
              // Also publish all tracks in this album
              await supabaseAdmin.from('tracks').update({ is_published: true }).eq('album_id', album.id);
              published++;
              await logTask(supabaseAdmin, userId, 'auto_publish', `Auto-published album "${album.title}"`, { album_id: album.id });
            }
          }
          if (published > 0) taskResults.push(`Published ${published} scheduled release(s)`);

          // Also check individual tracks with scheduled dates
          const { data: tracks } = await supabaseAdmin
            .from('tracks')
            .select('id, title, scheduled_release_date')
            .eq('user_id', userId)
            .eq('is_published', false)
            .not('scheduled_release_date', 'is', null);

          let tracksPub = 0;
          for (const track of (tracks || [])) {
            if (track.scheduled_release_date && new Date(track.scheduled_release_date) <= now) {
              await supabaseAdmin.from('tracks').update({ is_published: true }).eq('id', track.id);
              tracksPub++;
              await logTask(supabaseAdmin, userId, 'auto_publish', `Auto-published track "${track.title}"`, { track_id: track.id });
            }
          }
          if (tracksPub > 0) taskResults.push(`Published ${tracksPub} scheduled track(s)`);
        } catch (e) {
          console.error(`Auto-publish error for ${userId}:`, e);
        }
      }

      // --- 2. Auto-momentum tracking ---
      if (pilot.auto_momentum_tracking) {
        try {
          const { data: tracks } = await supabaseAdmin
            .from('tracks')
            .select('id, play_count')
            .eq('user_id', userId);

          const totalPlays = (tracks || []).reduce((s, t) => s + (t.play_count || 0), 0);

          const { count: followCount } = await supabaseAdmin
            .from('artist_follows')
            .select('id', { count: 'exact', head: true })
            .eq('artist_id', userId);

          // Update or create momentum score
          const { data: existingMomentum } = await supabaseAdmin
            .from('momentum_scores')
            .select('id, score')
            .eq('user_id', userId)
            .maybeSingle();

          const newScore = Math.min(100, Math.round(
            (totalPlays * 0.3) + ((followCount || 0) * 2) + ((tracks?.length || 0) * 5)
          ));

          if (existingMomentum) {
            await supabaseAdmin.from('momentum_scores')
              .update({ score: newScore, updated_at: new Date().toISOString() })
              .eq('id', existingMomentum.id);
          } else {
            await supabaseAdmin.from('momentum_scores')
              .insert({ user_id: userId, score: newScore, streak_days: 0 });
          }

          await logTask(supabaseAdmin, userId, 'momentum_update', `Momentum score updated to ${newScore}`, {
            total_plays: totalPlays, followers: followCount, tracks: tracks?.length
          });
          taskResults.push(`Momentum: ${newScore}/100`);
        } catch (e) {
          console.error(`Momentum error for ${userId}:`, e);
        }
      }

      // --- 3. Auto-analytics reports ---
      if (pilot.auto_analytics_reports) {
        try {
          const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

          const { data: recentStreams } = await supabaseAdmin
            .from('stream_events')
            .select('id', { count: 'exact', head: true })
            .eq('artist_id', userId)
            .gte('streamed_at', sevenDaysAgo);

          const { data: recentListeners } = await supabaseAdmin
            .from('listening_history')
            .select('user_id')
            .in('track_id', (await supabaseAdmin.from('tracks').select('id').eq('user_id', userId)).data?.map(t => t.id) || [])
            .gte('played_at', sevenDaysAgo);

          const uniqueListeners = new Set((recentListeners || []).map(l => l.user_id)).size;

          await logTask(supabaseAdmin, userId, 'analytics_report', `Weekly: ${recentStreams?.length || 0} streams, ${uniqueListeners} unique listeners`, {
            streams_7d: recentStreams?.length || 0,
            unique_listeners_7d: uniqueListeners,
          });
          taskResults.push(`Analytics snapshot generated`);
        } catch (e) {
          console.error(`Analytics error for ${userId}:`, e);
        }
      }

      // --- 4. Auto-fan engagement ---
      if (pilot.auto_fan_engagement) {
        try {
          // Update fan metrics
          const { count: followCount } = await supabaseAdmin
            .from('artist_follows')
            .select('id', { count: 'exact', head: true })
            .eq('artist_id', userId);

          await supabaseAdmin.from('fan_metrics')
            .upsert({
              user_id: userId,
              super_fans_count: Math.floor((followCount || 0) * 0.1),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          // Update monthly listeners
          await supabaseAdmin.rpc('update_artist_monthly_listeners').catch(() => {});

          await logTask(supabaseAdmin, userId, 'fan_engagement', `Fan metrics refreshed: ${followCount || 0} followers`, { followers: followCount });
          taskResults.push(`Fan engagement refreshed`);
        } catch (e) {
          console.error(`Fan engagement error for ${userId}:`, e);
        }
      }

      // --- 5. Auto-revenue optimization ---
      if (pilot.auto_revenue_optimization) {
        try {
          const { data: earnings } = await supabaseAdmin
            .from('artist_earnings')
            .select('*')
            .eq('artist_id', userId)
            .order('period_start', { ascending: false })
            .limit(2);

          if (earnings && earnings.length >= 2) {
            const current = earnings[0].streaming_revenue || 0;
            const previous = earnings[1].streaming_revenue || 0;
            const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

            await logTask(supabaseAdmin, userId, 'revenue_optimization', 
              `Revenue ${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}% vs last period. Current: $${current.toFixed(2)}`,
              { current_revenue: current, previous_revenue: previous, change_pct: change }
            );
            taskResults.push(`Revenue tracked: ${change >= 0 ? '+' : ''}${change}%`);
          } else {
            await logTask(supabaseAdmin, userId, 'revenue_optimization', 'Revenue tracking initialized — building baseline', {});
            taskResults.push('Revenue baseline building');
          }
        } catch (e) {
          console.error(`Revenue error for ${userId}:`, e);
        }
      }

      // --- 6. Auto-playlist pitching ---
      if (pilot.auto_playlist_pitching) {
        try {
          // Check for unpitched published tracks
          const { data: unpitchedTracks } = await supabaseAdmin
            .from('tracks')
            .select('id, title, genre, play_count')
            .eq('user_id', userId)
            .eq('is_published', true)
            .order('play_count', { ascending: false })
            .limit(5);

          if (unpitchedTracks && unpitchedTracks.length > 0) {
            const topTrack = unpitchedTracks[0];
            await logTask(supabaseAdmin, userId, 'playlist_pitching',
              `Top candidate for playlist pitching: "${topTrack.title}" (${topTrack.genre || 'General'}) — ${topTrack.play_count || 0} plays`,
              { track_id: topTrack.id, genre: topTrack.genre }
            );
            taskResults.push('Playlist candidates identified');
          }
        } catch (e) {
          console.error(`Pitching error for ${userId}:`, e);
        }
      }

      // Update last_run
      await supabaseAdmin.from('artist_autopilot')
        .update({
          last_run_at: new Date().toISOString(),
          run_count: (pilot.run_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      results.push({ userId, tasks: taskResults });
    }

    return new Response(JSON.stringify({ 
      processed: results.length, 
      results,
      timestamp: new Date().toISOString() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Autopilot error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function logTask(supabase: any, userId: string, taskType: string, summary: string, metadata: any) {
  await supabase.from('autopilot_logs').insert({
    user_id: userId,
    task_type: taskType,
    status: 'completed',
    summary,
    metadata,
  });
}
