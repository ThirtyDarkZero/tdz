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
    const { audioPath } = await req.json().catch(() => ({}));

    if (!audioPath) {
      throw new Error('Audio path is required');
    }

    console.log('Extracting lyrics from audio:', audioPath);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required environment variables not configured');
    }

    // Create Supabase client with service role to access private bucket
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Download audio file from private bucket
    const { data: audioBlob, error: downloadError } = await supabase.storage
      .from('audio-files')
      .download(audioPath);

    if (downloadError || !audioBlob) {
      console.error('Failed to download audio:', downloadError);
      throw new Error('Failed to download audio file from storage');
    }

    // Convert blob to base64
    const audioBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at transcribing song lyrics from audio. Listen to the audio and provide the complete lyrics, formatted with proper line breaks. Include all verses, choruses, and bridge sections. If you can't clearly hear certain words, use [?] as a placeholder.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please transcribe all the lyrics from this audio file.'
              },
              {
                type: 'audio_url',
                audio_url: {
                  url: `data:audio/wav;base64,${base64Audio}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI lyrics extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const lyrics = aiData.choices[0].message.content;
    
    console.log('Lyrics extracted successfully');

    return new Response(
      JSON.stringify({ lyrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-lyrics:', error);
    return new Response(
      JSON.stringify({ 
        error: publicError(error, 'Unknown error'),
        fallback: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
