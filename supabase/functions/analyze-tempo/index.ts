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
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { projectId, audioPath } = await req.json();

    console.log('[Tempo] Analyzing tempo for project:', projectId);

    // Use Lovable AI to analyze audio timing
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Download audio from storage
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      SUPABASE_SERVICE_ROLE_KEY ?? ''
    );
    
    const { data: audioBlob, error: downloadError } = await adminSupabase.storage
      .from('audio-files')
      .download(audioPath);

    if (downloadError || !audioBlob) {
      throw new Error('Failed to download audio file');
    }

    // Convert to base64
    const audioBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Analyze with AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert audio engineer. Analyze this audio and extract:
1. BPM (beats per minute) - detect any tempo changes
2. Beat grid - precise timing of every beat in seconds and frames (30fps)
3. Time signature

Return JSON:
{
  "bpmPoints": [{time: number, bpm: number}],
  "beatGrid": [{beat: number, time: number, frame: number}],
  "timeSignature": "4/4"
}

CRITICAL: Beat times must be accurate to ±33ms (1 frame at 30fps).`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze the tempo and beat grid for this audio:' },
              {
                type: 'audio_url',
                audio_url: { url: `data:audio/wav;base64,${base64Audio}` }
              }
            ]
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse tempo analysis');
    }
    
    const tempoData = JSON.parse(jsonMatch[0]);

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

    console.log('[Tempo] Analysis complete, beats:', tempoData.beatGrid.length);

    return new Response(
      JSON.stringify(tempoData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Tempo] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
