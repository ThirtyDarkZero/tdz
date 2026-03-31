import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') const preflight = handleCorsPreflightWithOrigin(req); if (preflight) return preflight;

  try {
    const { trackId, artistId, listenerId, sessionId, durationSeconds, deviceType } = await req.json();

    if (!trackId || !artistId) {
      return new Response(JSON.stringify({ error: "trackId and artistId required" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get IP from request headers for geolocation
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-real-ip');

    let geoData: Record<string, any> = {};
    if (ip && ip !== '127.0.0.1' && !ip.startsWith('10.') && !ip.startsWith('192.168.')) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          geoData = {
            country_code: geo.country_code || null,
            city: geo.city || null,
            region: geo.region || null,
            latitude: geo.latitude || null,
            longitude: geo.longitude || null,
          };
        }
      } catch { /* geolocation failure is non-critical */ }
    }

    const { error } = await supabaseAdmin
      .from('stream_events')
      .insert({
        track_id: trackId,
        artist_id: artistId,
        listener_id: listenerId || null,
        session_id: sessionId || null,
        duration_seconds: durationSeconds || 0,
        device_type: deviceType || 'web',
        platform: 'web',
        ...geoData,
        streamed_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Stream event insert error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Also increment track play_count
    await supabaseAdmin.rpc('increment_play_count_safe', { p_track_id: trackId }).catch(() => {
      // Fallback: direct update
      supabaseAdmin.from('tracks').select('play_count').eq('id', trackId).single().then(({ data }) => {
        if (data) {
          supabaseAdmin.from('tracks').update({ play_count: (data.play_count || 0) + 1 }).eq('id', trackId);
        }
      });
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Log stream error:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 200, // Don't block playback
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
