import { createClient } from 'npm:@supabase/supabase-js@2.57.2';
import { publicError } from "../_shared/errors.ts";

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

    // Parse request body for admin overrides
    let adminOverride = false;
    let specificTrackId: string | null = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json().catch(() => ({}));
        adminOverride = body.adminOverride === true;
        specificTrackId = body.trackId || null;
      } catch {
        // No body provided, continue with default behavior
      }
    }

    console.log('Starting auto-publish job...');
    console.log('Admin override:', adminOverride);
    console.log('Specific track ID:', specificTrackId);

    // Get current date/time in UTC
    const now = new Date();
    const todayUTC = now.toISOString().split('T')[0];
    console.log('Current UTC date:', todayUTC);
    console.log('Current UTC time:', now.toISOString());

    // If admin override with specific track, publish that track immediately
    if (adminOverride && specificTrackId) {
      console.log(`Admin override: Force publishing track ${specificTrackId}`);
      
      const { data: track, error: fetchError } = await supabase
        .from('tracks')
        .select('id, title, artist_name')
        .eq('id', specificTrackId)
        .single();

      if (fetchError || !track) {
        throw new Error(`Track not found: ${specificTrackId}`);
      }

      const { error: updateError } = await supabase
        .from('tracks')
        .update({ 
          is_published: true,
          release_date: todayUTC
        })
        .eq('id', specificTrackId);

      if (updateError) throw updateError;

      console.log(`Admin override: Published "${track.title}" by ${track.artist_name}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Force published track: ${track.title}`,
          publishedCount: 1,
          tracks: [track]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find tracks that should be published (release_date <= today and not yet published)
    const { data: tracksToPublish, error: fetchError } = await supabase
      .from('tracks')
      .select('id, title, artist_name, release_date')
      .is('is_published', false)
      .not('release_date', 'is', null)
      .lte('release_date', todayUTC);

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

    // Also check for albums to publish
    const { data: albumsToPublish, error: albumFetchError } = await supabase
      .from('albums')
      .select('id, title, artist_name, scheduled_release_date')
      .is('is_published', false)
      .not('scheduled_release_date', 'is', null)
      .lte('scheduled_release_date', todayUTC);

    if (!albumFetchError && albumsToPublish && albumsToPublish.length > 0) {
      const albumIds = albumsToPublish.map(a => a.id);
      await supabase
        .from('albums')
        .update({ 
          is_published: true,
          release_date: todayUTC
        })
        .in('id', albumIds);
      
      console.log(`Also published ${albumsToPublish.length} albums`);
    }

    console.log(`Successfully published ${tracksToPublish.length} tracks:`, 
      tracksToPublish.map(t => `${t.title} by ${t.artist_name}`));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Published ${tracksToPublish.length} tracks`,
        publishedCount: tracksToPublish.length,
        tracks: tracksToPublish,
        albumsPublished: albumsToPublish?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-publish-tracks:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: publicError(error, 'Unknown error occurred')
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});