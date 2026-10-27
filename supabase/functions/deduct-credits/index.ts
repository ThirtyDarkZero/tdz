import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const body = await req.json().catch(() => ({}));
    const amount = body?.amount;
    // Only positive whole credits can be deducted; negative amounts used to ADD credits.
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000) {
      return new Response(
        JSON.stringify({ error: 'amount must be a positive whole number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Credits] Deducting', amount, 'credits for user:', user.id);

    // The RPC is service-role only (clients can no longer call it directly).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    const { data, error } = await admin.rpc('deduct_render_credits', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: typeof body?.referenceType === 'string' ? body.referenceType.slice(0, 100) : null,
    });

    if (error) {
      if (/insufficient/i.test(error.message)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    console.log('[Credits] Deducted successfully, new balance:', data);

    return new Response(
      JSON.stringify({ success: true, newBalance: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Credits] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error && error.message === 'Unauthorized' ? 'Unauthorized' : 'Could not deduct credits' }),
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
