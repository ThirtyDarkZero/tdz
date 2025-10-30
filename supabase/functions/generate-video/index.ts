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

    const { sceneId, provider } = await req.json();

    if (!sceneId) {
      throw new Error('Scene ID is required');
    }

    console.log('Generating video for scene:', sceneId, 'using provider:', provider);

    // Fetch scene data
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*, projects(*)')
      .eq('id', sceneId)
      .single();

    if (sceneError || !scene) {
      throw new Error('Scene not found');
    }

    // Determine which provider to use
    const videoProvider = provider || (scene.projects as any)?.video_provider || 'sora';
    
    // Build the prompt from scene data
    const prompt = `${scene.description}. Mood: ${scene.mood}. Intensity: ${scene.intensity}/10. Style: ${(scene.projects as any)?.style_preset || 'Cinematic'}`;
    
    const duration = Math.round((scene.end_time - scene.start_time) * 1000) / 1000;

    console.log('Video generation request:', {
      provider: videoProvider,
      prompt,
      duration
    });

    // Route to appropriate video generation service
    let videoResponse;
    const baseUrl = Deno.env.get('SUPABASE_URL');

    switch (videoProvider) {
      case 'sora':
        videoResponse = await fetch(`${baseUrl}/functions/v1/generate-video-sora`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            prompt,
            duration: Math.min(duration, 20),
            aspectRatio: '16:9',
            audioPrompt: scene.mood
          }),
        });
        break;

      case 'runway':
        videoResponse = await fetch(`${baseUrl}/functions/v1/generate-video-runway`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            prompt,
            duration: Math.min(duration, 10)
          }),
        });
        break;

      case 'kling':
        videoResponse = await fetch(`${baseUrl}/functions/v1/generate-video-kling`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            prompt,
            duration: Math.min(duration, 10)
          }),
        });
        break;

      case 'veo':
        videoResponse = await fetch(`${baseUrl}/functions/v1/generate-video-veo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            prompt,
            duration: Math.min(duration, 8)
          }),
        });
        break;

      default:
        throw new Error(`Unknown video provider: ${videoProvider}`);
    }

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      throw new Error(`Video generation failed: ${errorText}`);
    }

    const videoData = await videoResponse.json();
    console.log('Video generated successfully:', videoData);

    // Update scene with video URL
    await supabase
      .from('scenes')
      .update({ 
        video_url: videoData.videoUrl,
        status: 'completed'
      })
      .eq('id', sceneId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoUrl: videoData.videoUrl,
        provider: videoProvider,
        sceneId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-video:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
