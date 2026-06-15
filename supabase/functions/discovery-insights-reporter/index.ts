import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { requireUser, unauthorized } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const auth = await requireUser(req);
    if (!auth.user) return unauthorized(corsHeaders);

    const { artistId } = await req.json();
    if (!artistId) {
      return new Response(JSON.stringify({ error: 'artistId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authorization: caller must own the artistId OR be ceo/admin
    if (auth.user.id !== artistId) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', auth.user.id)
        .in('role', ['ceo', 'admin']);
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get artist profile
    const { data: artist } = await supabase
      .from('artist_profiles')
      .select('artist_name, user_id')
      .eq('user_id', artistId)
      .maybeSingle();

    if (!artist) {
      return new Response(JSON.stringify({ error: 'Artist not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get this artist's tracks (used to scope demographics + history)
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, title, play_count')
      .eq('user_id', artistId)
      .eq('is_published', true);

    const trackIds = tracks?.map(t => t.id) || [];
    const safeTrackIds = trackIds.length > 0 ? trackIds : ['00000000-0000-0000-0000-000000000000'];

    // Aggregate listening demographics — scoped to this artist's tracks only
    const { data: demographics } = await supabase
      .from('listener_demographics')
      .select('country, city, device_type, browser, os, language, gender, age_range')
      .in('track_id', safeTrackIds)
      .limit(1000);

    // Get listening history stats
    const { data: history } = await supabase
      .from('listening_history')
      .select('user_id, played_at, duration_listened')
      .in('track_id', safeTrackIds)
      .order('played_at', { ascending: false })
      .limit(500);

    // Calculate demographic breakdowns
    const genderBreakdown: Record<string, number> = {};
    const ageBreakdown: Record<string, number> = {};
    const countryBreakdown: Record<string, number> = {};
    const deviceBreakdown: Record<string, number> = {};

    for (const d of demographics || []) {
      if (d.gender) genderBreakdown[d.gender] = (genderBreakdown[d.gender] || 0) + 1;
      if (d.age_range) ageBreakdown[d.age_range] = (ageBreakdown[d.age_range] || 0) + 1;
      if (d.country) countryBreakdown[d.country] = (countryBreakdown[d.country] || 0) + 1;
      if (d.device_type) deviceBreakdown[d.device_type] = (deviceBreakdown[d.device_type] || 0) + 1;
    }

    // Calculate listening time patterns
    const hourBreakdown: Record<number, number> = {};
    for (const h of history || []) {
      const hour = new Date(h.played_at).getHours();
      hourBreakdown[hour] = (hourBreakdown[hour] || 0) + 1;
    }

    const totalStreams = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
    const uniqueListeners = new Set(history?.map(h => h.user_id) || []).size;

    const insights = {
      artistName: artist.artist_name,
      totalStreams,
      uniqueListeners,
      totalTracks: tracks?.length || 0,
      demographics: {
        gender: genderBreakdown,
        ageRange: ageBreakdown,
        topCountries: Object.entries(countryBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([country, count]) => ({ country, count })),
        devices: deviceBreakdown,
      },
      listeningPatterns: {
        byHour: hourBreakdown,
        peakHour: Object.entries(hourBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] || null,
      },
      topTracks: (tracks || [])
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 10)
        .map(t => ({ title: t.title, plays: t.play_count || 0 })),
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('discovery-insights-reporter error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
