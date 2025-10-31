import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    // Get user's listening history
    const { data: history } = await supabase
      .from('listening_history')
      .select('track_id, tracks(genre, mood, bpm, ai_tags)')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(50);

    // Extract preferences from listening history
    const genres = new Map();
    const moods = new Map();
    history?.forEach((item: any) => {
      const track = item.tracks;
      if (track?.genre) genres.set(track.genre, (genres.get(track.genre) || 0) + 1);
      if (track?.mood) moods.set(track.mood, (moods.get(track.mood) || 0) + 1);
    });

    const topGenre = Array.from(genres.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topMood = Array.from(moods.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use AI to generate smart recommendations
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
            content: "You are a music recommendation AI. Generate diverse track recommendations based on user preferences."
          },
          {
            role: "user",
            content: `User likes ${topGenre || 'various'} music with ${topMood || 'various'} moods. Suggest 10 diverse tracks that match their taste but introduce variety. Return only a JSON array of objects with: title, artist, genre, mood, reason (why recommended).`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('AI recommendation failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    let recommendations;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      recommendations = [];
    }

    // Also get similar tracks from database
    const { data: dbTracks } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_published', true)
      .or(`genre.eq.${topGenre},mood.eq.${topMood}`)
      .limit(10);

    return new Response(JSON.stringify({
      ai_recommendations: recommendations,
      similar_tracks: dbTracks || [],
      preferences: {
        top_genre: topGenre,
        top_mood: topMood
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to get recommendations'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});