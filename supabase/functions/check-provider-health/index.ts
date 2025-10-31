import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !hasAdminRole) {
      throw new Error('Forbidden: Admin access required');
    }

    console.log('[Health] Checking all providers');

    const providers = ['sora', 'runway', 'kling', 'veo'];
    const results = [];

    for (const provider of providers) {
      const startTime = Date.now();
      let status = 'healthy';
      let error = null;

      try {
        // Simple health check - attempt to call provider endpoint
        const baseUrl = Deno.env.get('SUPABASE_URL');
        const response = await fetch(`${baseUrl}/functions/v1/generate-video-${provider}`, {
          method: 'OPTIONS',
          signal: AbortSignal.timeout(5000) // 5s timeout
        });
        
        if (!response.ok) {
          status = 'degraded';
        }
      } catch (e) {
        status = 'down';
        error = e instanceof Error ? e.message : 'Unknown error';
      }

      const responseTime = Date.now() - startTime;

      // Update health status
      await supabase
        .from('provider_health')
        .upsert({
          provider_name: provider,
          status,
          last_success_at: status === 'healthy' ? new Date().toISOString() : undefined,
          last_failure_at: status !== 'healthy' ? new Date().toISOString() : undefined,
          avg_response_time_ms: responseTime,
          last_error_message: error,
          checked_at: new Date().toISOString()
        }, { onConflict: 'provider_name' });

      results.push({ provider, status, responseTime });
    }

    console.log('[Health] Check complete:', results);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Health] Error:', error);
    // Return generic error to prevent information leakage
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
