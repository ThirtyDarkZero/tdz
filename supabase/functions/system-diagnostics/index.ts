import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticResult {
  name: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface SystemDiagnostics {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  services: DiagnosticResult[];
  summary: {
    healthy: number;
    degraded: number;
    errors: number;
    total: number;
  };
}

// Check Supabase database connection
async function checkDatabase(supabase: SupabaseClient): Promise<DiagnosticResult> {
  const start = performance.now();
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('id')
      .limit(1);

    const responseTime = performance.now() - start;

    if (error) {
      return {
        name: 'Database',
        status: 'error',
        responseTime,
        message: error.message,
      };
    }

    return {
      name: 'Database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      message: responseTime < 1000 ? 'Connection OK' : 'Slow response',
    };
  } catch (error) {
    return {
      name: 'Database',
      status: 'error',
      responseTime: performance.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Check Supabase storage
async function checkStorage(supabase: SupabaseClient): Promise<DiagnosticResult> {
  const start = performance.now();
  try {
    const { data, error } = await supabase.storage.listBuckets();

    const responseTime = performance.now() - start;

    if (error) {
      return {
        name: 'Storage',
        status: 'error',
        responseTime,
        message: error.message,
      };
    }

    const bucketNames = data?.map(b => b.name) || [];
    const requiredBuckets = ['track-files', 'album-covers', 'artist-images'];
    const missingBuckets = requiredBuckets.filter(b => !bucketNames.includes(b));

    if (missingBuckets.length > 0) {
      return {
        name: 'Storage',
        status: 'degraded',
        responseTime,
        message: `Missing buckets: ${missingBuckets.join(', ')}`,
        details: { buckets: bucketNames, missing: missingBuckets },
      };
    }

    return {
      name: 'Storage',
      status: 'healthy',
      responseTime,
      message: `${bucketNames.length} buckets available`,
      details: { buckets: bucketNames },
    };
  } catch (error) {
    return {
      name: 'Storage',
      status: 'error',
      responseTime: performance.now() - start,
      message: error instanceof Error ? error.message : 'Storage check failed',
    };
  }
}

// Check AI gateway (Lovable AI)
async function checkAIGateway(): Promise<DiagnosticResult> {
  const start = performance.now();
  const apiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!apiKey) {
    return {
      name: 'AI Gateway',
      status: 'error',
      message: 'LOVABLE_API_KEY not configured',
    };
  }

  try {
    // Just check if we can reach the endpoint (don't actually make a full request)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });

    const responseTime = performance.now() - start;

    if (response.status === 429) {
      return {
        name: 'AI Gateway',
        status: 'degraded',
        responseTime,
        message: 'Rate limited',
      };
    }

    if (response.status === 402) {
      return {
        name: 'AI Gateway',
        status: 'degraded',
        responseTime,
        message: 'Credits exhausted',
      };
    }

    if (!response.ok && response.status !== 400) {
      return {
        name: 'AI Gateway',
        status: 'error',
        responseTime,
        message: `HTTP ${response.status}`,
      };
    }

    return {
      name: 'AI Gateway',
      status: 'healthy',
      responseTime,
      message: 'Connected',
    };
  } catch (error) {
    return {
      name: 'AI Gateway',
      status: 'error',
      responseTime: performance.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Check OpenAI API
async function checkOpenAI(): Promise<DiagnosticResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    return {
      name: 'OpenAI API',
      status: 'unknown',
      message: 'Not configured',
    };
  }

  const start = performance.now();
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const responseTime = performance.now() - start;

    if (response.status === 401) {
      return {
        name: 'OpenAI API',
        status: 'error',
        responseTime,
        message: 'Invalid API key',
      };
    }

    if (!response.ok) {
      return {
        name: 'OpenAI API',
        status: 'error',
        responseTime,
        message: `HTTP ${response.status}`,
      };
    }

    return {
      name: 'OpenAI API',
      status: 'healthy',
      responseTime,
      message: 'Connected',
    };
  } catch (error) {
    return {
      name: 'OpenAI API',
      status: 'error',
      responseTime: performance.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Check Stripe API
async function checkStripe(): Promise<DiagnosticResult> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return { name: 'Stripe Payments', status: 'error', message: 'STRIPE_SECRET_KEY not set' };
  }
  const start = performance.now();
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const responseTime = performance.now() - start;
    if (res.status === 401) {
      return { name: 'Stripe Payments', status: 'error', responseTime, message: 'Invalid Stripe key' };
    }
    if (!res.ok) {
      return { name: 'Stripe Payments', status: 'error', responseTime, message: `HTTP ${res.status}` };
    }
    return { name: 'Stripe Payments', status: 'healthy', responseTime, message: 'Connected' };
  } catch (error) {
    return {
      name: 'Stripe Payments', status: 'error',
      responseTime: performance.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Check unmatched transactions count
async function checkUnmatched(supabase: SupabaseClient): Promise<DiagnosticResult> {
  try {
    const { count } = await supabase
      .from('unmatched_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    const unmatched = count || 0;
    return {
      name: 'Financial Reconciliation',
      status: unmatched === 0 ? 'healthy' : unmatched < 5 ? 'degraded' : 'error',
      message: `${unmatched} unmatched transactions`,
      details: { count: unmatched },
    };
  } catch {
    return { name: 'Financial Reconciliation', status: 'unknown', message: 'Check failed' };
  }
}

// Check stuck payouts (>7 days pending)
async function checkStuckPayouts(supabase: SupabaseClient): Promise<DiagnosticResult> {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('artist_payouts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'processing', 'pending_manual'])
      .lt('created_at', cutoff);
    const stuck = count || 0;
    return {
      name: 'Payout Pipeline',
      status: stuck === 0 ? 'healthy' : stuck < 3 ? 'degraded' : 'error',
      message: stuck === 0 ? 'No stuck payouts' : `${stuck} payouts stuck >7 days`,
      details: { count: stuck },
    };
  } catch {
    return { name: 'Payout Pipeline', status: 'unknown', message: 'Check failed' };
  }
}

// Legacy Square check (kept for back-compat; will return unknown if not configured)
async function checkSquare(): Promise<DiagnosticResult> {
  const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
  const appId = Deno.env.get('SQUARE_APPLICATION_ID');

  if (!accessToken || !appId) {
    return {
      name: 'Square Payments',
      status: 'unknown',
      message: 'Not configured',
    };
  }

  const start = performance.now();
  try {
    const response = await fetch('https://connect.squareup.com/v2/locations', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseTime = performance.now() - start;

    if (response.status === 401) {
      return {
        name: 'Square Payments',
        status: 'error',
        responseTime,
        message: 'Invalid credentials',
      };
    }

    if (!response.ok) {
      return {
        name: 'Square Payments',
        status: 'error',
        responseTime,
        message: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    const locations = data.locations?.length || 0;

    return {
      name: 'Square Payments',
      status: 'healthy',
      responseTime,
      message: `${locations} location(s) configured`,
      details: { locations },
    };
  } catch (error) {
    return {
      name: 'Square Payments',
      status: 'error',
      responseTime: performance.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Provider health interface
interface ProviderHealthRecord {
  provider_name: string;
  status: string;
  avg_response_time_ms?: number;
  last_error_message?: string;
  success_count_1h: number;
  error_count_1h: number;
  last_success_at?: string;
}

// Check provider health table
async function checkProviderHealth(supabase: SupabaseClient): Promise<DiagnosticResult[]> {
  try {
    const { data: providers } = await supabase
      .from('provider_health')
      .select('*')
      .order('checked_at', { ascending: false });

    if (!providers || providers.length === 0) {
      return [];
    }

    // Get latest status for each provider
    const latestByProvider = new Map<string, ProviderHealthRecord>();
    (providers as ProviderHealthRecord[]).forEach(p => {
      if (!latestByProvider.has(p.provider_name)) {
        latestByProvider.set(p.provider_name, p);
      }
    });

    return Array.from(latestByProvider.values()).map(p => ({
      name: `Video: ${p.provider_name}`,
      status: p.status === 'healthy' ? 'healthy' : p.status === 'degraded' ? 'degraded' : 'error' as const,
      responseTime: p.avg_response_time_ms || undefined,
      message: p.last_error_message || 'OK',
      details: {
        successCount1h: p.success_count_1h,
        errorCount1h: p.error_count_1h,
        lastSuccess: p.last_success_at,
      },
    }));
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify CEO access - MANDATORY
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    // Check CEO role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'ceo')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Running system diagnostics...');

    // Run all checks in parallel
    const [
      dbResult,
      storageResult,
      aiResult,
      openaiResult,
      stripeResult,
      unmatchedResult,
      stuckPayoutsResult,
      providerResults,
    ] = await Promise.all([
      checkDatabase(supabase),
      checkStorage(supabase),
      checkAIGateway(),
      checkOpenAI(),
      checkStripe(),
      checkUnmatched(supabase),
      checkStuckPayouts(supabase),
      checkProviderHealth(supabase),
    ]);

    const services: DiagnosticResult[] = [
      dbResult,
      storageResult,
      aiResult,
      openaiResult,
      stripeResult,
      unmatchedResult,
      stuckPayoutsResult,
      ...providerResults,
    ];

    // Log to system_health_log
    try {
      await supabase.from('system_health_log').insert(
        services.map(s => ({
          check_type: s.name.toLowerCase().replace(/\s+/g, '_'),
          status: s.status === 'healthy' ? 'healthy' : s.status === 'degraded' ? 'degraded' : 'error',
          duration_ms: s.responseTime ? Math.round(s.responseTime) : null,
          error_message: s.status === 'error' ? s.message : null,
          details: s.details || null,
        }))
      );
    } catch (e) {
      console.error('Failed to log health:', e);
    }

    // Calculate summary
    const summary = {
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      errors: services.filter(s => s.status === 'error').length,
      total: services.length,
    };

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (summary.errors > 0) {
      overallStatus = summary.errors >= 2 ? 'critical' : 'degraded';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }

    const diagnostics: SystemDiagnostics = {
      timestamp: new Date().toISOString(),
      overallStatus,
      services,
      summary,
    };

    console.log(`Diagnostics complete: ${overallStatus}`);

    return new Response(
      JSON.stringify(diagnostics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Diagnostics error:', error);
    return new Response(
      JSON.stringify({ error: 'Diagnostics failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
