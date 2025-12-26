import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation
function validateInput(data: unknown): { trackId: string; completionPercentage?: number; duration?: number } | { error: string } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid request body' };
  }

  const { trackId, completionPercentage, duration } = data as Record<string, unknown>;

  // Validate trackId - required and must be UUID
  if (!trackId || typeof trackId !== 'string') {
    return { error: 'Missing or invalid trackId' };
  }
  if (!UUID_REGEX.test(trackId)) {
    return { error: 'Invalid trackId format - must be a valid UUID' };
  }

  // Validate completionPercentage - optional, must be number 0-100
  let validatedCompletionPercentage: number | undefined;
  if (completionPercentage !== undefined) {
    if (typeof completionPercentage !== 'number' || isNaN(completionPercentage)) {
      return { error: 'completionPercentage must be a number' };
    }
    if (completionPercentage < 0 || completionPercentage > 100) {
      return { error: 'completionPercentage must be between 0 and 100' };
    }
    validatedCompletionPercentage = completionPercentage;
  }

  // Validate duration - optional, must be non-negative number
  let validatedDuration: number | undefined;
  if (duration !== undefined) {
    if (typeof duration !== 'number' || isNaN(duration)) {
      return { error: 'duration must be a number' };
    }
    if (duration < 0 || duration > 86400) { // Max 24 hours
      return { error: 'duration must be between 0 and 86400 seconds' };
    }
    validatedDuration = duration;
  }

  return { 
    trackId, 
    completionPercentage: validatedCompletionPercentage, 
    duration: validatedDuration 
  };
}

// Generate device fingerprint from request headers
function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  
  // Create a simple fingerprint from available headers
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

// Get client IP address from request
function getClientIP(req: Request): string | null {
  // Check common headers for real IP (when behind proxy/CDN)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return null;
}

// This function records a stream with fraud detection and updates artist earnings ($1 per stream)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request metadata for fraud detection
    const clientIP = getClientIP(req);
    const deviceFingerprint = generateDeviceFingerprint(req);

    // Optional auth - streams can be recorded for anonymous users too
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(rawBody);
    if ('error' in validation) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { trackId, completionPercentage, duration } = validation;

    // FRAUD DETECTION: Validate stream before counting
    if (userId) {
      const { data: fraudCheck, error: fraudError } = await supabase.rpc('validate_stream', {
        p_user_id: userId,
        p_track_id: trackId,
        p_ip_address: clientIP,
        p_device_fingerprint: deviceFingerprint,
      });

      if (fraudError) {
        console.error('Fraud check error:', fraudError);
        // Continue with caution - log but don't block
      } else if (fraudCheck && !fraudCheck.allowed) {
        console.warn(`Stream blocked for user ${userId}: ${fraudCheck.reason}`);
        return new Response(
          JSON.stringify({ 
            recorded: false, 
            reason: fraudCheck.reason || 'Stream validation failed',
            blocked: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (fraudCheck && fraudCheck.fraud_score > 0) {
        console.log(`Stream allowed with fraud score: ${fraudCheck.fraud_score} for user ${userId}`);
      }
    }

    // Only count as a valid stream if:
    // 1. User listened for at least 30 seconds OR
    // 2. User completed at least 50% of the track
    const MIN_DURATION_SECONDS = 30;
    const MIN_COMPLETION_PERCENT = 50;
    
    const isValidStream = 
      (duration && duration >= MIN_DURATION_SECONDS) || 
      (completionPercentage && completionPercentage >= MIN_COMPLETION_PERCENT);

    if (!isValidStream) {
      return new Response(
        JSON.stringify({ recorded: false, reason: 'Stream too short to count' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, user_id, play_count, is_published')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      return new Response(
        JSON.stringify({ error: 'Track not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only count streams for published tracks
    if (!track.is_published) {
      return new Response(
        JSON.stringify({ recorded: false, reason: 'Track not published' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-streaming (artists streaming their own tracks)
    if (userId && userId === track.user_id) {
      return new Response(
        JSON.stringify({ recorded: false, reason: 'Self-streams not counted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record listening history if user is logged in
    if (userId) {
      await supabase
        .from('listening_history')
        .insert({
          user_id: userId,
          track_id: trackId,
          play_duration: duration || 0,
          completion_percentage: completionPercentage || 0,
          device_type: deviceFingerprint ? 'web' : null,
        });
    }

    // Increment track play count
    const newPlayCount = (track.play_count || 0) + 1;
    await supabase
      .from('tracks')
      .update({ play_count: newPlayCount })
      .eq('id', trackId);

    // Update artist profile total plays
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('total_plays')
      .eq('user_id', track.user_id)
      .single();
    
    if (artistProfile) {
      await supabase
        .from('artist_profiles')
        .update({ 
          total_plays: (artistProfile.total_plays || 0) + 1
        })
        .eq('user_id', track.user_id);
    }

    // $1 PER STREAM - Update artist earnings
    const STREAM_PAYOUT_RATE = 1.00; // $1.00 per stream
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get or create current period earnings
    const { data: existingEarnings } = await supabase
      .from('artist_earnings')
      .select('id, streaming_revenue, total_streams, total_earnings')
      .eq('artist_id', track.user_id)
      .eq('period_start', periodStart)
      .maybeSingle();

    if (existingEarnings) {
      // Update existing period
      const newStreamingRevenue = (existingEarnings.streaming_revenue || 0) + STREAM_PAYOUT_RATE;
      const newTotalStreams = (existingEarnings.total_streams || 0) + 1;
      const newTotalEarnings = (existingEarnings.total_earnings || 0) + STREAM_PAYOUT_RATE;

      await supabase
        .from('artist_earnings')
        .update({
          streaming_revenue: newStreamingRevenue,
          total_streams: newTotalStreams,
          total_earnings: newTotalEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEarnings.id);

      console.log(`Updated artist ${track.user_id} earnings: +$${STREAM_PAYOUT_RATE} (total: $${newTotalEarnings})`);
    } else {
      // Create new earnings period
      await supabase
        .from('artist_earnings')
        .insert({
          artist_id: track.user_id,
          period_start: periodStart,
          period_end: periodEnd,
          streaming_revenue: STREAM_PAYOUT_RATE,
          total_streams: 1,
          total_earnings: STREAM_PAYOUT_RATE,
          payout_status: 'pending',
        });

      console.log(`Created new earnings period for artist ${track.user_id}: $${STREAM_PAYOUT_RATE}`);
    }

    // Log activity if user is logged in
    if (userId) {
      await supabase
        .from('activity_log')
        .insert({
          user_id: userId,
          activity_type: 'stream',
          target_type: 'track',
          target_id: trackId,
          is_public: false,
          metadata: {
            ip: clientIP,
            fingerprint: deviceFingerprint,
          }
        });
    }

    return new Response(
      JSON.stringify({
        recorded: true,
        playCount: newPlayCount,
        artistEarned: STREAM_PAYOUT_RATE,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error recording stream:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to record stream' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
