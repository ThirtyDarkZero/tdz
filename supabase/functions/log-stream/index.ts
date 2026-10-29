import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;

  try {
    // SECURITY: Require authentication — prevents anyone from inflating play counts.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { trackId, artistId, listenerId, sessionId, durationSeconds, deviceType } = await req.json().catch(() => ({}));

    // SECURITY: Strict UUID validation before any DB writes.
    if (!trackId || !artistId || !UUID_REGEX.test(trackId) || !UUID_REGEX.test(artistId)) {
      return new Response(JSON.stringify({ error: "Invalid trackId or artistId" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (listenerId && !UUID_REGEX.test(listenerId)) {
      return new Response(JSON.stringify({ error: "Invalid listenerId" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Listener id, if provided, must match the authenticated user.
    const safeListenerId = listenerId && listenerId === user.id ? listenerId : user.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Attribute the stream to the track's real owner, not a client-supplied id.
    const { data: trackRow } = await supabaseAdmin
      .from('tracks').select('user_id').eq('id', trackId).maybeSingle();
    if (!trackRow?.user_id || trackRow.user_id !== artistId) {
      return new Response(JSON.stringify({ error: "Track not found for this artist" }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        listener_id: safeListenerId,
        session_id: sessionId || null,
        duration_seconds: Math.max(0, Math.min(Number(durationSeconds) || 0, 7200)),
        device_type: typeof deviceType === 'string' ? deviceType.slice(0, 32) : 'web',
        platform: 'web',
        ...geoData,
        streamed_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Stream event insert error:", error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to record stream' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Also increment track play_count
    const { error: incErr } = await supabaseAdmin.rpc('increment_play_count_safe', { p_track_id: trackId });
    if (incErr) console.error('increment_play_count_safe failed:', incErr.message);

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
