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
    const { projectId, bpm } = await req.json();

    console.log('[Tempo] Creating simplified tempo map for project:', projectId);

    // Verify JWT token properly using Supabase
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

    const userId = user.id;

    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a simple beat grid based on BPM
    // This is a lightweight alternative to processing entire audio files
    const beatDuration = 60 / bpm; // seconds per beat
    const totalBeats = 240; // Assume ~4 minute song max
    
    const beatGrid = [];
    const bpmPoints = [{ time: 0, bpm }];
    
    for (let i = 0; i < totalBeats; i++) {
      const time = i * beatDuration;
      const frame = Math.round(time * 30); // 30fps
      beatGrid.push({
        beat: i + 1,
        time: parseFloat(time.toFixed(3)),
        frame
      });
    }

    const tempoData = {
      bpmPoints,
      beatGrid,
      timeSignature: "4/4"
    };

    // Store in database
    const { error: dbError } = await supabase
      .from('tempo_maps')
      .upsert({
        project_id: projectId,
        bpm_points: tempoData.bpmPoints,
        beat_grid: tempoData.beatGrid,
        time_signature: tempoData.timeSignature
      }, { onConflict: 'project_id' });

    if (dbError) throw dbError;

    console.log('[Tempo] Simplified tempo map created, beats:', beatGrid.length);

    return new Response(
      JSON.stringify(tempoData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Tempo] Error:', error);
    // Return generic error to prevent information leakage
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
