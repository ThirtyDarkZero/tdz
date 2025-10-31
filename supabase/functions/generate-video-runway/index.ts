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
    const { prompt, referenceImage, duration = 5 } = await req.json();
    console.log('Runway Gen-4 generation request:', { prompt, referenceImage, duration });

    const RUNWAY_API_KEY = Deno.env.get('RUNWAY_API_KEY');
    if (!RUNWAY_API_KEY) {
      throw new Error('RUNWAY_API_KEY not configured');
    }

    // Runway requires an image for video generation
    // If no reference image provided, use a neutral placeholder
    const promptImage = referenceImage || 'https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_(cropped).jpg';

    // Call Runway Gen-4 Turbo API for image-to-video
    const requestBody = {
      model: 'gen4_turbo',
      promptImage: promptImage,
      promptText: prompt,
      ratio: '1280:720',
      duration: Math.min(duration, 10) // Gen-4 supports up to 10 seconds
    };

    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Runway API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Runway API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Runway generation initiated:', data);

    // Poll for completion
    const taskId = data.id;
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5 second intervals)

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Runway status check error:', statusResponse.status, errorText);
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log('Runway status check:', statusData);

      if (statusData.status === 'SUCCEEDED' && statusData.output && statusData.output.length > 0) {
        videoUrl = statusData.output[0];
      } else if (statusData.status === 'FAILED') {
        throw new Error(`Video generation failed: ${statusData.failure || 'Unknown error'}`);
      }
      
      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timeout');
    }

    return new Response(
      JSON.stringify({ 
        videoUrl: videoUrl,
        provider: 'runway',
        metadata: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-video-runway:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
