import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, bpm, mood } = await req.json();

    if (!lyrics) {
      throw new Error('Lyrics are required');
    }

    console.log('Analyzing lyrics with context:', { bpm, mood });

    // Use Lovable AI to break down lyrics into scenes
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: `You are an expert music video director. Analyze song lyrics and break them down into cinematic scenes.

For each distinct section (intro, verse, chorus, bridge, outro), create a scene with:
1. Scene type (Intro, Verse 1, Chorus, Verse 2, Bridge, Outro, etc.)
2. Estimated timing (start and end in seconds, based on typical song structure)
3. Visual description (setting, mood, camera work, what should be shown)
4. Mood/emotion for the scene
5. Intensity level (0-100, matching the energy of that section)

Return as JSON array with these exact fields for each scene:
{
  "type": string,
  "startTime": number (seconds),
  "endTime": number (seconds),
  "description": string (detailed visual description),
  "mood": string,
  "intensity": number (0-100)
}

Consider the song's BPM (${bpm}) and overall mood (${mood}) when estimating timings and intensity.`
          },
          {
            role: 'user',
            content: `Lyrics:\n\n${lyrics}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    console.log('AI lyrics analysis response:', analysisText);

    // Parse JSON array from AI response
    let scenes;
    try {
      const jsonMatch = analysisText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scenes = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse scene analysis');
    }

    return new Response(
      JSON.stringify({ scenes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-lyrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
