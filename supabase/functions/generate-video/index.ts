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

    // Verify JWT token properly using Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed');
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sceneId, provider, retryCount = 0 } = await req.json();

    if (!sceneId) {
      throw new Error('Scene ID is required');
    }

    console.log(`[Video Gen] Starting: scene=${sceneId}, provider=${provider}, retry=${retryCount}`);

    // Fetch scene data with project details
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*, projects(*)')
      .eq('id', sceneId)
      .single();

    if (sceneError || !scene) {
      console.error('[Video Gen] Scene not found:', sceneError);
      throw new Error('Scene not found');
    }

    // Fetch approved characters for this project
    const { data: characters } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', (scene.projects as any).id)
      .eq('is_approved', true)
      .order('display_order', { ascending: true });

    console.log(`[Video Gen] Found ${characters?.length || 0} approved characters`);

    // Determine which provider to use with fallback logic
    let videoProvider = provider || (scene.projects as any)?.video_provider || 'sora';
    const providerFallbacks = ['sora', 'runway', 'kling', 'veo'];
    
    console.log(`[Video Gen] Using provider: ${videoProvider}`);
    
    // Build the prompt from scene data with all style parameters
    const project = scene.projects as any;
    let prompt = `Music video scene (SILENT VIDEO ONLY - no audio generation): ${scene.description}. `;
    
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

    console.log(`[Video Gen] Request details:`, {
      provider: videoProvider,
      duration,
      hasCharacters: !!characters?.length,
      promptLength: prompt.length
    });

    // Retry logic with provider fallback - try all providers until one works
    let videoResponse;
    let lastError;
    let videoUrl = null;
    const baseUrl = Deno.env.get('SUPABASE_URL');

    // Build fallback chain: primary provider first, then all others
    // Note: Currently only Runway is fully supported
    // Sora: API endpoint issues (405 errors)
    // Kling: Requires valid FAL_API_KEY with kling-video access
    // Veo: Not supported through Lovable AI Gateway
    const workingProviders = ['runway'];
    const allProviders = [videoProvider === 'runway' ? videoProvider : 'runway'];
    
    for (let attempt = 0; attempt < allProviders.length && !videoUrl; attempt++) {
      try {
        const currentProvider = allProviders[attempt];
        
        console.log(`[Video Gen] Attempt ${attempt + 1}/${allProviders.length} with provider: ${currentProvider}`);

        switch (currentProvider) {
          case 'sora':
            videoResponse = await fetch(`${baseUrl}/functions/v1/generate-video-sora`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
              },
              body: JSON.stringify({
                prompt: `${prompt} IMPORTANT: Generate silent video only, no audio track.`,
                duration: Math.min(duration, 20),
                aspectRatio: '16:9',
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
                prompt: `${prompt} Generate silent video only for music video.`,
                referenceImage: referenceImageUrl,
                duration: Math.min(duration, 10),
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
                prompt: `${prompt} Silent video for music video - no audio generation.`,
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
                prompt: `${prompt} Generate silent video only, no audio track.`,
                duration: Math.min(duration, 8),
                referenceImage: referenceImageUrl
              }),
            });
            break;

          default:
            throw new Error(`Unknown video provider: ${currentProvider}`);
        }

        if (videoResponse.ok) {
          console.log(`[Video Gen] Success with ${currentProvider}`);
          const videoData = await videoResponse.json();
          videoUrl = videoData.videoUrl;
          
          // Update scene with video URL
          await supabase
            .from('scenes')
            .update({ 
              generated_video_url: videoData.videoUrl
            })
            .eq('id', sceneId);

          console.log(`[Video Gen] Scene updated with video URL`);

          return new Response(
            JSON.stringify({ 
              success: true, 
              videoUrl: videoData.videoUrl,
              provider: currentProvider,
              sceneId,
              attempt: attempt + 1,
              totalAttempts: allProviders.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const errorText = await videoResponse.text();
        console.error(`[Video Gen] ${currentProvider} error:`, errorText);
        
        // Parse error and provide user-friendly messages
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.includes('not have enough credits') || errorData.details?.includes('not have enough credits')) {
            lastError = new Error(`${currentProvider} has insufficient credits. Trying next provider...`);
            console.log(`[Video Gen] ${currentProvider} credits exhausted, trying next provider`);
          } else if (errorData.error?.includes('405') || errorData.error?.includes('Invalid method')) {
            lastError = new Error(`${currentProvider} API endpoint unavailable. Trying next provider...`);
            console.log(`[Video Gen] ${currentProvider} API issue, trying next provider`);
          } else {
            lastError = new Error(`${currentProvider} failed: ${errorText}`);
          }
        } catch {
          lastError = new Error(`${currentProvider} failed: ${errorText}`);
        }
        
      } catch (error) {
        lastError = error;
        console.error(`[Video Gen] Attempt ${attempt + 1} failed:`, error);
      }
    }

    // All video providers failed - fallback to still image generation
    console.log('[Video Gen] All video providers failed, generating still image as fallback');
    
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('AI service temporarily unavailable');
      }

      // Generate a still image using Lovable AI
      const imagePrompt = `Create a cinematic still frame for: ${prompt}. High quality, professional photography style.`;
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: imagePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        throw new Error(`Image generation failed: ${errorText}`);
      }

      const imageData = await imageResponse.json();
      const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!base64Image) {
        throw new Error('No image returned from AI');
      }

      // Convert base64 to blob and upload to storage
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `fallback-${sceneId}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-videos')
        .upload(fileName, binaryData, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-videos')
        .getPublicUrl(fileName);

      videoUrl = urlData.publicUrl;

      // Update scene with image URL
      await supabase
        .from('scenes')
        .update({ 
          generated_video_url: videoUrl
        })
        .eq('id', sceneId);

      console.log('[Video Gen] Still image fallback successful:', videoUrl);

      return new Response(
        JSON.stringify({ 
          success: true, 
          videoUrl: videoUrl,
          provider: 'lovable-ai-image',
          isFallback: true,
          sceneId,
          message: 'Generated still image as video providers are unavailable'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fallbackError) {
      console.error('[Video Gen] Image fallback also failed:', fallbackError);
      throw new Error(`Video generation failed. ${lastError instanceof Error ? lastError.message : 'Unknown error'}. Image fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}. Please add credits to your Runway account at https://runwayml.com.`);
    }
  } catch (error) {
    console.error('[Video Gen] Fatal error:', error);
    // Return generic error to prevent information leakage
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred processing your request'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
