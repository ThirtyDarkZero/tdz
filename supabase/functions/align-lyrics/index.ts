import "../_shared/aiFallback.ts";
import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { publicError } from "../_shared/errors.ts";

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

    const { projectId, audioPath, lyrics } = await req.json().catch(() => ({}));

    console.log('[Align] Aligning lyrics to audio for project:', projectId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Download audio
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      SUPABASE_SERVICE_ROLE_KEY ?? ''
    );
    
    const { data: audioBlob } = await adminSupabase.storage
      .from('audio-files')
      .download(audioPath);

    if (!audioBlob) {
      throw new Error('Failed to download audio');
    }

    const audioBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Use AI for forced alignment
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
            content: `You are an expert in forced phoneme alignment. Align these lyrics to the audio.

For EACH WORD, provide:
- word: string
- startTime: number (seconds, accurate to ±250ms)
- endTime: number (seconds)
- confidence: number (0-1)
- lineIndex: number
- wordIndex: number
- phonemes: [{phoneme: string, start: number, end: number}]

Return JSON array of all words with precise timing:
[{word, startTime, endTime, confidence, lineIndex, wordIndex, phonemes}]

CRITICAL: Timing accuracy must be ±250ms or better for captions.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Lyrics:\n${lyrics}\n\nAlign to audio:` },
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
    
    const jsonMatch = analysisText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse alignment');
    }
    
    const alignments = JSON.parse(jsonMatch[0]);

    // Delete old alignments
    await supabase
      .from('lyric_alignments')
      .delete()
      .eq('project_id', projectId);

    // Insert new alignments
    const records = alignments.map((a: any) => ({
      project_id: projectId,
      ...a
    }));

    const { error: dbError } = await supabase
      .from('lyric_alignments')
      .insert(records);

    if (dbError) throw dbError;

    console.log('[Align] Aligned', alignments.length, 'words');

    return new Response(
      JSON.stringify({ alignments, count: alignments.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Align] Error:', error);
    return new Response(
      JSON.stringify({ error: publicError(error, 'Unknown error') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
