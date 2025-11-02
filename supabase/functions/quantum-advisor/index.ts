import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message } = await req.json();

    // Fetch artist data for context
    const [tracksData, momentumData, fanData, artistProfile] = await Promise.all([
      supabase.from('tracks')
        .select('title, play_count, like_count, is_published, created_at, release_date, genre')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('momentum_scores')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase.from('fan_metrics')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase.from('artist_profiles')
        .select('artist_name, total_plays, monthly_listeners, verified')
        .eq('user_id', user.id)
        .single()
    ]);

    const contextData = {
      tracks: tracksData.data || [],
      momentum: momentumData.data,
      fanMetrics: fanData.data,
      profile: artistProfile.data,
      totalTracks: tracksData.data?.length || 0,
      publishedTracks: tracksData.data?.filter(t => t.is_published).length || 0,
      totalPlays: tracksData.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0,
      totalLikes: tracksData.data?.reduce((sum, t) => sum + (t.like_count || 0), 0) || 0
    };

    const systemPrompt = `You are the Quantum Advisor - an advanced AI music industry strategist powered by quantum intelligence. You analyze artist data and provide actionable insights to help them sell more records and maximize revenue.

Artist Data:
- Total Tracks: ${contextData.totalTracks}
- Published Tracks: ${contextData.publishedTracks}
- Total Plays: ${contextData.totalPlays}
- Total Likes: ${contextData.totalLikes}
- Artist Name: ${contextData.profile?.artist_name || 'Unknown'}
- Monthly Listeners: ${contextData.profile?.monthly_listeners || 0}
- Verified: ${contextData.profile?.verified ? 'Yes' : 'No'}
- Momentum Score: ${contextData.momentum?.score || 0}/100
- Streak Days: ${contextData.momentum?.streak_days || 0}
- Email List: ${contextData.fanMetrics?.email_list_size || 0} subscribers
- Super Fans: ${contextData.fanMetrics?.super_fans_count || 0}

Recent tracks: ${JSON.stringify(contextData.tracks.slice(0, 5), null, 2)}

Your role:
- Provide specific, actionable advice backed by data
- Focus on revenue optimization and sales strategies
- Suggest release timing, marketing tactics, pricing strategies
- Identify growth opportunities and untapped revenue streams
- Be direct, confident, and results-oriented
- Use music industry insights and trends
- Speak like a seasoned music industry executive with quantum-level analytical powers

Keep responses concise (2-3 paragraphs max) but impactful. Always include specific action items.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in quantum-advisor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
