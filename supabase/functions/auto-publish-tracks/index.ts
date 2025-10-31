import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-publish job...');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking for tracks to publish on or before:', today);

    // Find tracks that should be published (release_date <= today and not yet published)
    const { data: tracksToPublish, error: fetchError } = await supabase
      .from('tracks')
      .select('id, title, artist_name, release_date')
      .is('is_published', false)
      .not('release_date', 'is', null)
      .lte('release_date', today);

    if (fetchError) {
      console.error('Error fetching tracks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${tracksToPublish?.length || 0} tracks to publish`);

    if (!tracksToPublish || tracksToPublish.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No tracks to publish',
          publishedCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Publish all eligible tracks
    const trackIds = tracksToPublish.map(t => t.id);
    const { error: updateError } = await supabase
      .from('tracks')
      .update({ is_published: true })
      .in('id', trackIds);

    if (updateError) {
      console.error('Error publishing tracks:', updateError);
      throw updateError;
    }

    console.log(`Successfully published ${tracksToPublish.length} tracks:`, 
      tracksToPublish.map(t => `${t.title} by ${t.artist_name}`));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Published ${tracksToPublish.length} tracks`,
        publishedCount: tracksToPublish.length,
        tracks: tracksToPublish
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-publish-tracks:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
