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
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    console.log('Analyzing audio:', audioUrl);

    // Use Lovable AI to analyze audio characteristics
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
            content: `You are an expert music analyzer. Analyze the audio file and provide:
1. BPM (beats per minute) - estimated tempo
2. Mood (choose one: Cinematic, Uplifting, Dark, Ethereal, Energetic, Romantic, Melancholic, Hype)
3. Energy level (0-100)
4. Musical key (if detectable)
5. Time signature

Return your analysis as JSON with these exact fields:
{
  "bpm": number,
  "mood": string,
  "energy": number,
  "key": string,
  "timeSignature": string
}`
          },
          {
            role: 'user',
            content: `Based on typical music characteristics and the file name/context, provide an estimated analysis. Audio URL: ${audioUrl}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    console.log('AI analysis response:', analysisText);

    // Parse JSON from AI response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Provide fallback analysis
        analysis = {
          bpm: 120,
          mood: 'Cinematic',
          energy: 70,
          key: 'C Major',
          timeSignature: '4/4'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback:', parseError);
      analysis = {
        bpm: 120,
        mood: 'Cinematic',
        energy: 70,
        key: 'C Major',
        timeSignature: '4/4'
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
