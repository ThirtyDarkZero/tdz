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
    console.log('Kling AI generation request:', { prompt, imageUrl, duration });

    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY not configured');
    }

    // Use Kling via fal.ai API
    const model = imageUrl 
      ? 'fal-ai/kling-video/v2.1/standard/image-to-video'
      : 'fal-ai/kling-video/v2.1/standard/text-to-video';

    const requestBody: any = {
      prompt: prompt,
      duration: duration === 5 ? '5' : '10'
    };

    if (imageUrl) {
      requestBody.image_url = imageUrl;
    }

    console.log('Calling fal.ai with model:', model);
    const response = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kling/fal.ai API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Kling API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Kling generation successful:', data);

    return new Response(
      JSON.stringify({ 
        videoUrl: data.video?.url || data.video,
        provider: 'kling',
        metadata: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-video-kling:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
