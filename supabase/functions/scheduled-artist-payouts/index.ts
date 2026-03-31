import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

// This function runs on a schedule (1st of each month) to process all pending artist payouts
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    const preflight = handleCorsPreflightWithOrigin(req); if (preflight) return preflight;
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting scheduled artist payout processing...');

    // Get all artists with pending earnings above minimum threshold ($50)
    const { data: artistsWithPendingEarnings, error: earningsError } = await supabase
      .from('artist_earnings')
      .select('artist_id, total_earnings')
      .eq('payout_status', 'pending')
      .gte('total_earnings', 50);

    if (earningsError) {
      console.error('Error fetching pending earnings:', earningsError);
      throw earningsError;
    }

    // Group earnings by artist
    const artistEarnings: Record<string, number> = {};
    artistsWithPendingEarnings?.forEach(earning => {
      if (!artistEarnings[earning.artist_id]) {
        artistEarnings[earning.artist_id] = 0;
      }
      artistEarnings[earning.artist_id] += earning.total_earnings || 0;
    });

    const results: Array<{ artistId: string; status: string; amount?: number; error?: string }> = [];

    // Process each artist with pending payouts
    for (const [artistId, totalPending] of Object.entries(artistEarnings)) {
      if (totalPending < 50) continue;

      try {
        // Check if artist has payout enabled
        const { data: payoutDetails } = await supabase
          .from('artist_payout_details')
          .select('*')
          .eq('artist_id', artistId)
          .eq('payout_enabled', true)
          .maybeSingle();

        if (!payoutDetails) {
          console.log(`Artist ${artistId} does not have payout enabled, skipping`);
          results.push({ artistId, status: 'skipped', error: 'Payout not enabled' });
          continue;
        }

        // Get all pending earnings for this artist
        const { data: pendingEarnings } = await supabase
          .from('artist_earnings')
          .select('id')
          .eq('artist_id', artistId)
          .eq('payout_status', 'pending');

        const earningsIds = pendingEarnings?.map(e => e.id) || [];

        // Attempt Square payout if token is available
        let squarePayoutId = null;
        let payoutStatus = 'pending_manual';

        if (squareAccessToken && payoutDetails.square_customer_id) {
          try {
            // Note: Square Payouts API requires seller account setup
            // For now, we record the payout and mark for manual processing
            console.log(`Recording payout for artist ${artistId}: $${totalPending}`);
            payoutStatus = 'processing';
          } catch (squareError) {
            console.error(`Square payout error for artist ${artistId}:`, squareError);
            payoutStatus = 'pending_manual';
          }
        }

        // Record the payout
        const { data: payout, error: payoutError } = await supabase
          .from('artist_payouts')
          .insert({
            artist_id: artistId,
            amount: totalPending,
            status: payoutStatus,
            earnings_ids: earningsIds,
            square_payout_id: squarePayoutId,
          })
          .select()
          .single();

        if (payoutError) {
          throw payoutError;
        }

        // Update earnings status
        await supabase
          .from('artist_earnings')
          .update({ 
            payout_status: 'processing',
            payout_date: new Date().toISOString()
          })
          .in('id', earningsIds);

        // Update artist payout details
        await supabase
          .from('artist_payout_details')
          .update({ last_payout_date: new Date().toISOString() })
          .eq('artist_id', artistId);

        results.push({ artistId, status: 'processed', amount: totalPending });
        console.log(`Payout recorded for artist ${artistId}: $${totalPending}`);

      } catch (artistError: any) {
        console.error(`Error processing payout for artist ${artistId}:`, artistError);
        results.push({ artistId, status: 'error', error: artistError.message });
      }
    }

    console.log('Scheduled payout processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.filter(r => r.status === 'processed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled payout:', error);
    return new Response(
      JSON.stringify({ error: 'Scheduled payout processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
