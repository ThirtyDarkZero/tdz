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
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Extract JWT token and decode to get user ID
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      console.error('No user ID in token');
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user:', userId);

    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId } = await req.json();

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log('Generating scenes for project:', projectId);

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    if (!project.lyrics) {
      throw new Error('Lyrics are required to generate scenes');
    }

    // Fetch approved characters for this project
    const { data: characters } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_approved', true)
      .order('display_order', { ascending: true });

    // Use Lovable AI to generate scenes with all style parameters
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get style-specific visual guidance
    const styleGuides: Record<string, string> = {
      "Cinematic": "Hollywood cinematography, dramatic lighting, professional color grading, film grain",
      "Tokyo Neon": "Neon-lit streets, cyberpunk aesthetics, vibrant colors, urban nightlife, Japanese signs",
      "Golden Hour": "Warm sunset lighting, natural beauty, soft glow, lens flares, outdoor scenes",
      "Shadow Realm": "Dark atmospheric scenes, mysterious shadows, low-key lighting, thriller vibes",
      "Eden Light": "Ethereal nature scenes, magical forest, glowing plants, fairy-tale atmosphere",
      "Desert Dreams": "Arid desert landscapes, heat waves, warm tones, vast open spaces",
      "Arctic Freeze": "Cold icy environments, minimalist, blue-white tones, winter wonderland",
      "Synthwave": "80s retro aesthetics, grid patterns, purple-pink neon, vintage film look",
      "Noir": "Black and white, high contrast, detective story vibes, dramatic shadows",
      "Candy Pop": "Bright colorful scenes, playful energy, oversaturated colors, fun atmosphere",
      "Urban Grit": "Street photography, raw energy, urban decay, graffiti, gritty realism",
      "Cosmic": "Space scenes, galaxies, stars, nebulas, cosmic phenomena, zero gravity",
    };

    const styleGuide = styleGuides[project.style_preset || "Cinematic"] || styleGuides["Cinematic"];
    const emotionLevel = project.emotion_intensity || 70;
    const cameraMotion = project.camera_motion || 50;
    const fantasyLevel = project.fantasy_realism || 60;

    const cameraGuidance = cameraMotion < 30 
      ? "mostly static shots, locked camera, minimal movement"
      : cameraMotion < 70 
      ? "moderate camera movement, smooth pans and tilts"
      : "dynamic camera work, sweeping movements, tracking shots, aerial views";

    const realismGuidance = fantasyLevel < 30
      ? "photorealistic, documentary style, natural settings"
      : fantasyLevel < 70
      ? "slightly surreal elements, enhanced reality, artistic interpretation"
      : "highly fantastical, dreamlike, surreal visuals, magical elements";

    // Build character guidance
    let characterGuidance = "";
    if (characters && characters.length > 0) {
      const characterNames = characters.map((c: any) => c.name).join(", ");
      characterGuidance = `\n\nAPPROVED CHARACTERS: ${characterNames}
      - Feature these characters as the main subjects in scenes
      - Describe how each character appears and what they're doing
      - Maintain character consistency across scenes
      - For character scenes, be specific about their actions, expressions, and positions`;
    }

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
            content: `You are an expert music video director. Analyze song lyrics and break them down into cinematic scenes.

VISUAL STYLE: ${styleGuide}
EMOTION INTENSITY: ${emotionLevel}/100 (${emotionLevel < 30 ? 'subtle, understated' : emotionLevel < 70 ? 'moderate, balanced' : 'intense, dramatic'})
CAMERA WORK: ${cameraGuidance}
VISUAL REALISM: ${realismGuidance}${characterGuidance}

For each distinct section (intro, verse, chorus, bridge, outro), create a scene with:
1. Scene type (Intro, Verse 1, Chorus, Verse 2, Bridge, Outro, etc.)
2. Estimated timing (start and end in seconds, based on typical song structure and BPM ${project.bpm})
3. Visual description matching the style guide above - be HIGHLY SPECIFIC about:
   - Exact location and setting (e.g., "rooftop at golden hour with city skyline")
   - Precise lighting (e.g., "rim lighting from setting sun, warm orange glow")
   - Camera angles and movement (e.g., "slow dolly push in from wide to close-up")
   - Visual effects or elements (e.g., "lens flares, bokeh lights in background")
   - Subject's actions and emotions (e.g., "artist singing passionately, gesturing to camera")
   - If characters are provided, feature them prominently with specific actions
4. Mood/emotion for the scene
5. Intensity level (0-100, matching the energy of that section)

Return as JSON array with these exact fields for each scene:
{
  "type": string,
  "startTime": number (seconds),
  "endTime": number (seconds),
  "description": string (detailed visual description following the style guide),
  "mood": string,
  "intensity": number (0-100)
}

Make scenes 5-15 seconds each. Use the BPM (${project.bpm}) and overall mood (${project.mood}) for timing.`
          },
          {
            role: 'user',
            content: `Lyrics:\n\n${project.lyrics}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI scene generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    console.log('AI scene generation response:', analysisText);

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

    // Insert scenes into database
    const scenesToInsert = scenes.map((scene: any, index: number) => ({
      project_id: projectId,
      scene_order: index + 1,
      scene_type: scene.type,
      start_time: scene.startTime,
      end_time: scene.endTime,
      description: scene.description,
      mood: scene.mood,
      intensity: scene.intensity,
    }));

    // Delete existing scenes for this project
    await supabase
      .from('scenes')
      .delete()
      .eq('project_id', projectId);

    // Insert new scenes
    const { error: insertError } = await supabase
      .from('scenes')
      .insert(scenesToInsert);

    if (insertError) {
      throw insertError;
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'scenes_generated' })
      .eq('id', projectId);

    return new Response(
      JSON.stringify({ success: true, scenesCount: scenes.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-scenes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
