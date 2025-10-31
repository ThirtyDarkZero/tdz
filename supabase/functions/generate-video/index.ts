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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    // Fetch scene data with project details
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*, projects(*)')
      .eq('id', sceneId)
      .single();

    if (sceneError || !scene) {
      throw new Error('Scene not found');
    }

    // Fetch approved characters for this project
    const { data: characters } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', (scene.projects as any).id)
      .eq('is_approved', true)
      .order('display_order', { ascending: true });

    // Determine which provider to use
    const videoProvider = provider || (scene.projects as any)?.video_provider || 'sora';
    
    // Build the prompt from scene data with all style parameters
    const project = scene.projects as any;
    let prompt = `Music video scene: ${scene.description}. `;
    
    // Add character references if available
    if (characters && characters.length > 0) {
      const characterDesc = characters.map((c: any) => c.name).join(' and ');
      prompt += `Featuring ${characterDesc}. `;
    }
    
    prompt += `Mood: ${scene.mood}. `;
    
    // Add style information
    if (project.style_preset) {
      const styleMap: Record<string, string> = {
        "Cinematic": "Hollywood-style cinematography, dramatic lighting, film grain, professional color grading",
        "Tokyo Neon": "Neon-lit cyberpunk streets, vibrant colors, Japanese urban nightlife",
        "Golden Hour": "Warm golden sunset lighting, natural beauty, soft lens flares",
        "Shadow Realm": "Dark mysterious atmosphere, low-key lighting, noir thriller aesthetic",
        "Eden Light": "Ethereal magical forest, glowing nature, fairy-tale lighting",
        "Desert Dreams": "Vast desert landscape, heat waves, warm cinematic tones",
        "Arctic Freeze": "Cold icy environment, blue-white tones, minimalist winter aesthetic",
        "Synthwave": "80s retro vaporwave, purple-pink neon grid, vintage film grain",
        "Noir": "High contrast black and white, dramatic shadows, detective noir style",
        "Candy Pop": "Bright oversaturated colors, playful pop art energy",
        "Urban Grit": "Raw street photography, urban decay, gritty realistic aesthetic",
        "Cosmic": "Space nebulas, galaxies, stars, cosmic phenomena, zero gravity"
      };
      prompt += `Visual style: ${styleMap[project.style_preset] || project.style_preset}. `;
    }
    
    // Add intensity
    const intensityDesc = scene.intensity > 70 ? 'high energy, intense action' : 
                         scene.intensity > 40 ? 'moderate energy, balanced pacing' : 
                         'low energy, calm and subtle';
    prompt += `Energy: ${intensityDesc}. `;
    
    // Add camera motion guidance
    const cameraMotion = project.camera_motion || 50;
    if (cameraMotion < 30) {
      prompt += `Camera: Static locked shots, tripod mounted, no movement. `;
    } else if (cameraMotion < 70) {
      prompt += `Camera: Smooth cinematic movement, gentle pans and tilts. `;
    } else {
      prompt += `Camera: Dynamic sweeping cinematography, tracking shots, dramatic movements. `;
    }
    
    // Add fantasy/realism guidance
    const fantasyLevel = project.fantasy_realism || 60;
    if (fantasyLevel < 30) {
      prompt += `Style: Photorealistic, natural, documentary aesthetic. `;
    } else if (fantasyLevel > 70) {
      prompt += `Style: Highly fantastical, surreal dreamlike visuals, magical elements. `;
    }
    
    // Build character reference images
    let referenceImageUrl = null;
    if (characters && characters.length > 0) {
      // Use first approved character as reference
      const firstChar = characters[0] as any;
      try {
        const { data } = await supabase.storage
          .from('characters')
          .createSignedUrl(firstChar.media_path, 3600);
        
        if (data?.signedUrl) {
          referenceImageUrl = data.signedUrl;
          prompt += `Match character appearance from reference image. `;
        }
      } catch (error) {
        console.error('Error loading character reference:', error);
      }
    }
    
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
            audioPrompt: scene.mood,
            referenceImage: referenceImageUrl
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
            duration: Math.min(duration, 10),
            referenceImage: referenceImageUrl
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
            duration: Math.min(duration, 10),
            referenceImage: referenceImageUrl
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
            duration: Math.min(duration, 8),
            referenceImage: referenceImageUrl
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
        generated_video_url: videoData.videoUrl
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
