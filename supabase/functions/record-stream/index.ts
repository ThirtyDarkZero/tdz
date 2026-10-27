import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Focus metrics from client-side tracking
interface FocusMetrics {
  focusedDuration: number;
  totalDuration: number;
  focusPercentage: number;
}

// Input validation
function validateInput(data: unknown): { 
  trackId: string; 
  completionPercentage?: number; 
  duration?: number;
  focusMetrics?: FocusMetrics;
} | { error: string } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid request body' };
  }

  const { trackId, completionPercentage, duration, focusMetrics } = data as Record<string, unknown>;

  if (!trackId || typeof trackId !== 'string') {
    return { error: 'Missing or invalid trackId' };
  }
  if (!UUID_REGEX.test(trackId)) {
    return { error: 'Invalid trackId format - must be a valid UUID' };
  }

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

  let validatedDuration: number | undefined;
  if (duration !== undefined) {
    if (typeof duration !== 'number' || isNaN(duration)) {
      return { error: 'duration must be a number' };
    }
    if (duration < 0 || duration > 86400) {
      return { error: 'duration must be between 0 and 86400 seconds' };
    }
    validatedDuration = duration;
  }

  let validatedFocusMetrics: FocusMetrics | undefined;
  if (focusMetrics && typeof focusMetrics === 'object') {
    const fm = focusMetrics as Record<string, unknown>;
    if (typeof fm.focusedDuration === 'number' && 
        typeof fm.totalDuration === 'number' && 
        typeof fm.focusPercentage === 'number') {
      validatedFocusMetrics = {
        focusedDuration: fm.focusedDuration,
        totalDuration: fm.totalDuration,
        focusPercentage: Math.min(100, Math.max(0, fm.focusPercentage)),
      };
    }
  }

  return { 
    trackId, 
    completionPercentage: validatedCompletionPercentage, 
    duration: validatedDuration,
    focusMetrics: validatedFocusMetrics,
  };
}

function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

function getClientIP(req: Request): string | null {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  return null;
}

// Check if user has an active paid subscription
async function isPaidSubscriber(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .in('status', ['active', 'trial'])
    .maybeSingle();

  if (!data) return false;
  
  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  
  // Only paid plans count: starter, pro, enterprise, fan
  const paidPlans = ['starter', 'pro', 'enterprise', 'fan'];
  return paidPlans.includes(data.plan);
}

// This function records a stream with fraud detection
// Artists earn $1 per stream ONLY when played by a PAID subscriber past the 30-second preview
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const clientIP = getClientIP(req);
    const deviceFingerprint = generateDeviceFingerprint(req);

    // Auth required for earning streams
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

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

    const { trackId, completionPercentage, duration, focusMetrics } = validation;

    // FOCUS-BASED FRAUD DETECTION
    const MIN_FOCUS_PERCENTAGE = 50;
    if (focusMetrics) {
      if (focusMetrics.focusPercentage < MIN_FOCUS_PERCENTAGE) {
        console.log(`Stream rejected: Focus percentage ${focusMetrics.focusPercentage.toFixed(1)}% below ${MIN_FOCUS_PERCENTAGE}% threshold`);
        return new Response(
          JSON.stringify({ 
            recorded: false, 
            reason: 'Insufficient active listening time',
            focusPercentage: focusMetrics.focusPercentage,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // FRAUD DETECTION — fails closed for money: if the check can't run, the
    // play still counts but earns nothing.
    let fraudCheckPassed = !userId;
    if (userId) {
      const { data: fraudCheck, error: fraudError } = await supabase.rpc('validate_stream', {
        p_user_id: userId,
        p_track_id: trackId,
        p_ip_address: clientIP,
        p_device_fingerprint: deviceFingerprint,
      });

      if (fraudError) {
        console.error('Fraud check error — stream will not earn:', fraudError);
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
      } else {
        fraudCheckPassed = true;
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

    // Prevent self-streaming
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
          location_data: focusMetrics ? {
            focus_percentage: focusMetrics.focusPercentage,
            focused_duration: focusMetrics.focusedDuration,
          } : null,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // PAID SUBSCRIBER CHECK: Only paid subscribers generate $1 earnings
    // Free/anonymous plays still count as plays but do NOT generate revenue
    // ═══════════════════════════════════════════════════════════════
    const listenerIsPaid = userId && fraudCheckPassed ? await isPaidSubscriber(supabase, userId) : false;

    // Increment track play count (all valid streams count for visibility)
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

    // $1 PER STREAM - ONLY for paid subscriber plays
    let artistEarned = 0;
    if (listenerIsPaid) {
      const STREAM_PAYOUT_RATE = 1.00;
      artistEarned = STREAM_PAYOUT_RATE;
      
      // Atomic credit into this month's PENDING earnings row. Streams never land
      // on a row that's already paid/processing, and concurrent streams can't
      // overwrite each other's increments.
      const { error: creditErr } = await supabase.rpc('credit_artist_stream', {
        p_artist_id: track.user_id,
        p_amount: STREAM_PAYOUT_RATE,
      });
      if (creditErr) {
        console.error(`Failed to credit stream for artist ${track.user_id}:`, creditErr.message);
        artistEarned = 0;
      }

      console.log(`Paid stream: Artist ${track.user_id} earned $${STREAM_PAYOUT_RATE} from subscriber ${userId}`);
    } else {
      console.log(`Free stream: Track ${trackId} played by ${userId || 'anonymous'} - no earnings generated`);
    }

    // Log activity
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
            focus_metrics: focusMetrics,
            paid_stream: listenerIsPaid,
          }
        });
    }

    return new Response(
      JSON.stringify({
        recorded: true,
        playCount: newPlayCount,
        artistEarned,
        paidStream: listenerIsPaid,
        artistId: track.user_id,
        focusPercentage: focusMetrics?.focusPercentage,
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
