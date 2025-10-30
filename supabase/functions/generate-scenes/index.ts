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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

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

    // Analyze lyrics if provided
    let scenes = [];
    if (project.lyrics) {
      const lyricsResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-lyrics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            lyrics: project.lyrics,
            bpm: project.bpm || 120,
            mood: project.mood || 'Cinematic',
          }),
        }
      );

      if (lyricsResponse.ok) {
        const lyricsData = await lyricsResponse.json();
        scenes = lyricsData.scenes || [];
      }
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
