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
    const { filePath, fileName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use AI to analyze track metadata from filename and suggest tags
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a music metadata expert. Analyze the filename and provide metadata suggestions in JSON format only."
          },
          {
            role: "user",
            content: `Analyze this music filename and suggest metadata: "${fileName}". Return ONLY valid JSON with fields: genre (string), mood (string), bpm (number, estimate), key (string, estimate like "C Major"), tags (array of descriptive strings)`
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(JSON.stringify({
        tags: ["uncategorized"],
        bpm: null,
        key: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    // Parse AI response
    let aiMetadata;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      aiMetadata = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      aiMetadata = {};
    }

    return new Response(JSON.stringify({
      tags: aiMetadata.tags || ["uncategorized"],
      bpm: aiMetadata.bpm || null,
      key: aiMetadata.key || null,
      genre: aiMetadata.genre || null,
      mood: aiMetadata.mood || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Metadata analysis error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to analyze metadata',
      tags: ["uncategorized"],
      bpm: null,
      key: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});