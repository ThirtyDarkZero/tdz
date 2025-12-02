import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Track listener demographics for each stream

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function records a stream and updates artist earnings ($1 per stream)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional auth - streams can be recorded for anonymous users too
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { trackId, completionPercentage, duration } = await req.json();

    if (!trackId) {
      return new Response(
        JSON.stringify({ error: 'Missing trackId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Record listening history if user is logged in
    if (userId) {
      await supabase
        .from('listening_history')
        .insert({
          user_id: userId,
          track_id: trackId,
          play_duration: duration || 0,
          completion_percentage: completionPercentage || 0,
        });
    }

    // Increment track play count
    const newPlayCount = (track.play_count || 0) + 1;
    await supabase
      .from('tracks')
      .update({ play_count: newPlayCount })
      .eq('id', trackId);

    // Update artist profile total plays (increment via raw update)
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
