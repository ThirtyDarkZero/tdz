// Auto-payout job — runs 1st of each month via pg_cron.
// Pays all artists with $50+ pending earnings via Stripe Connect transfers.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsPreflightWithOrigin } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const preflight = handleCorsPreflightWithOrigin(req);
  if (preflight) return preflight;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    console.log('Scheduled artist payouts starting...');

    const { data: pendingEarnings } = await supabase
      .from('artist_earnings')
      .select('id, artist_id, total_earnings')
      .eq('payout_status', 'pending');

    const byArtist: Record<string, { total: number; ids: string[] }> = {};
    pendingEarnings?.forEach((e) => {
      if (!byArtist[e.artist_id]) byArtist[e.artist_id] = { total: 0, ids: [] };
      byArtist[e.artist_id].total += e.total_earnings || 0;
      byArtist[e.artist_id].ids.push(e.id);
    });

    const results: Array<{ artistId: string; status: string; amount?: number; error?: string; transferId?: string }> = [];

    for (const [artistId, { total, ids }] of Object.entries(byArtist)) {
      if (total < 50) {
        results.push({ artistId, status: 'skipped', error: 'Below $50 threshold' });
        continue;
      }

      try {
        const { data: payoutDetails } = await supabase
          .from('artist_payout_details')
          .select('stripe_connect_id, payout_enabled')
          .eq('artist_id', artistId)
          .maybeSingle();

        if (!payoutDetails?.stripe_connect_id || !payoutDetails.payout_enabled) {
          results.push({ artistId, status: 'skipped', error: 'Stripe Connect not ready' });
          continue;
        }

        const transfer = await stripe.transfers.create({
          amount: Math.round(total * 100),
          currency: 'usd',
          destination: payoutDetails.stripe_connect_id,
          description: `TDZ monthly artist payout`,
          metadata: { artist_id: artistId, type: 'monthly_payout' },
        });

        await supabase.from('artist_payouts').insert({
          artist_id: artistId,
          amount: total,
          status: 'completed',
          earnings_ids: ids,
          square_payout_id: transfer.id,
          completed_at: new Date().toISOString(),
        });

        await supabase.from('artist_earnings')
          .update({ payout_status: 'paid', payout_date: new Date().toISOString().split("T")[0] })
          .in('id', ids);

        await supabase.from('artist_payout_details')
          .update({ last_payout_date: new Date().toISOString() })
          .eq('artist_id', artistId);

        results.push({ artistId, status: 'processed', amount: total, transferId: transfer.id });
        console.log(`Paid artist ${artistId}: $${total} (transfer ${transfer.id})`);
      } catch (err: any) {
        console.error(`Payout failed for artist ${artistId}:`, err);
        results.push({ artistId, status: 'error', error: err.message });
      }
    }

    await supabase.from('system_health_log').insert({
      check_type: 'scheduled_payouts',
      status: results.some(r => r.status === 'error') ? 'degraded' : 'healthy',
      details: {
        processed: results.filter(r => r.status === 'processed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
      },
    });

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scheduled payout error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
