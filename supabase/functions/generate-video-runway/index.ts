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
    const { prompt, imageUrl, duration = 5 } = await req.json();
    console.log('Runway Gen-3 generation request:', { prompt, imageUrl, duration });

    const RUNWAY_API_KEY = Deno.env.get('RUNWAY_API_KEY');
    if (!RUNWAY_API_KEY) {
      throw new Error('RUNWAY_API_KEY not configured');
    }

    // Call Runway Gen-3 Alpha Turbo API
    const requestBody: any = {
      model: 'gen3a_turbo',
      prompt: prompt,
      duration: duration
    };

    if (imageUrl) {
      requestBody.image_url = imageUrl;
    }

    const response = await fetch('https://api.runwayml.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
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
    const maxAttempts = 60; // 5 minutes max

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log('Runway status check:', statusData);

      if (statusData.status === 'SUCCEEDED') {
        videoUrl = statusData.output[0];
      } else if (statusData.status === 'FAILED') {
        throw new Error('Video generation failed');
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
