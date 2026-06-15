import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser, unauthorized } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  {
    const __auth = await requireUser(req);
    if (!__auth.user) return unauthorized(corsHeaders);
  }

  try {
    const { prompt, limit = 20 } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Prompt must be at least 3 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use AI to interpret the mood prompt and extract search parameters
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    let searchTerms = { genres: [] as string[], moods: [] as string[], keywords: [] as string[], bpmRange: null as [number, number] | null };

    if (openaiKey) {
      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Extract music search parameters from the user mood description. Return JSON with: genres (array of genre names), moods (array like "chill", "energetic", "dark", "happy"), keywords (search terms for YouTube), bpmRange ([min, max] or null). Be creative mapping vibes to genres.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });
        const aiData = await aiRes.json();
        const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
        searchTerms = { ...searchTerms, ...parsed };
      } catch (e) {
        console.error('AI interpretation failed, using keyword fallback:', e);
      }
    }

    // Search local TDZ tracks matching mood
    const keywords = [...searchTerms.genres, ...searchTerms.moods, ...searchTerms.keywords];
    const searchQuery = keywords.length > 0 ? keywords.join(' ') : prompt;

    const { data: localTracks } = await supabase
      .from('tracks')
      .select('id, title, artist_name, duration, genre, mood, album_cover_path, album_cover_bucket, file_path, play_count, ai_tags')
      .eq('is_published', true)
      .limit(50);

    // Score and filter local tracks by relevance
    const scoredTracks = (localTracks || []).map(track => {
      let score = 0;
      const trackGenre = (track.genre || '').toLowerCase();
      const trackMood = (track.mood || '').toLowerCase();
      const trackTitle = (track.title || '').toLowerCase();
      const promptLower = prompt.toLowerCase();

      for (const g of searchTerms.genres) {
        if (trackGenre.includes(g.toLowerCase())) score += 3;
      }
      for (const m of searchTerms.moods) {
        if (trackMood.includes(m.toLowerCase())) score += 2;
        if (trackTitle.includes(m.toLowerCase())) score += 1;
      }
      for (const k of searchTerms.keywords) {
        if (trackTitle.includes(k.toLowerCase())) score += 1;
        if (trackGenre.includes(k.toLowerCase())) score += 1;
      }
      // Fuzzy match on prompt words
      for (const word of promptLower.split(/\s+/)) {
        if (word.length > 2 && (trackGenre.includes(word) || trackMood.includes(word) || trackTitle.includes(word))) {
          score += 1;
        }
      }

      return { ...track, relevanceScore: score, source: 'tdz' as const };
    }).filter(t => t.relevanceScore > 0).sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, Math.min(limit, 10));

    // Also search YouTube for more variety
    let youtubeTracks: any[] = [];
    try {
      const ytKey = Deno.env.get('YOUTUBE_API_KEY');
      if (ytKey) {
        const ytQuery = `${searchQuery} music`;
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${Math.min(limit, 15)}&q=${encodeURIComponent(ytQuery)}&key=${ytKey}`;
        const ytRes = await fetch(ytUrl);
        const ytData = await ytRes.json();

        if (ytData.items) {
          youtubeTracks = ytData.items.map((item: any) => ({
            id: `yt-${item.id.videoId}`,
            title: item.snippet.title,
            artist_name: item.snippet.channelTitle,
            duration: 0,
            file_path: '',
            play_count: 0,
            source: 'youtube',
            youtubeId: item.id.videoId,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          }));
        }
      }
    } catch (e) {
      console.error('YouTube search failed:', e);
    }

    // Interleave TDZ and YouTube results
    const mixedResults: any[] = [];
    let tdzIdx = 0, ytIdx = 0;
    while (mixedResults.length < limit && (tdzIdx < scoredTracks.length || ytIdx < youtubeTracks.length)) {
      // Prioritize TDZ tracks (2:1 ratio)
      if (tdzIdx < scoredTracks.length) {
        mixedResults.push(scoredTracks[tdzIdx++]);
      }
      if (tdzIdx < scoredTracks.length) {
        mixedResults.push(scoredTracks[tdzIdx++]);
      }
      if (ytIdx < youtubeTracks.length) {
        mixedResults.push(youtubeTracks[ytIdx++]);
      }
    }
    // Fill remaining with YouTube
    while (mixedResults.length < limit && ytIdx < youtubeTracks.length) {
      mixedResults.push(youtubeTracks[ytIdx++]);
    }

    return new Response(JSON.stringify({
      mixName: `${prompt}`,
      tracks: mixedResults,
      searchTerms,
      totalTracks: mixedResults.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generate-mood-mix error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate mood mix' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
