import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { publicError } from "../_shared/errors.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { projectId, format, includeTimeline, includeCaptions } = await req.json().catch(() => ({}));

    console.log('[Export] Starting export:', { projectId, format });

    // Create export record
    const { data: exportRecord, error: createError } = await supabase
      .from('exports')
      .insert({
        project_id: projectId,
        user_id: user.id,
        format,
        status: 'queued',
        includes_otio: includeTimeline,
        includes_edl: includeTimeline,
        includes_xml: includeTimeline,
        includes_captions: includeCaptions
      })
      .select()
      .single();

    if (createError) throw createError;

    console.log('[Export] Export queued:', exportRecord.id);

    // Background processing would happen here
    // For now, return immediately with queued status
    
    return new Response(
      JSON.stringify({ 
        success: true,
        exportId: exportRecord.id,
        status: 'queued',
        message: 'Export queued for processing. Check status endpoint for updates.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Export] Error:', error);
    return new Response(
      JSON.stringify({ error: publicError(error, 'Unknown error') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
