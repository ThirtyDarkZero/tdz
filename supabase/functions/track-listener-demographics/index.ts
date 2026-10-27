import "../_shared/fetchTimeout.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation
function validateInput(data: unknown): { trackId?: string; artistId: string; listenerId?: string } | { error: string } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid request body' };
  }

  const { trackId, artistId, listenerId } = data as Record<string, unknown>;

  // Validate artistId - required and must be UUID
  if (!artistId || typeof artistId !== 'string') {
    return { error: 'Missing or invalid artistId' };
  }
  if (!UUID_REGEX.test(artistId)) {
    return { error: 'Invalid artistId format - must be a valid UUID' };
  }

  // Validate trackId - optional, but if provided must be UUID
  let validatedTrackId: string | undefined;
  if (trackId !== undefined) {
    if (typeof trackId !== 'string') {
      return { error: 'trackId must be a string' };
    }
    if (!UUID_REGEX.test(trackId)) {
      return { error: 'Invalid trackId format - must be a valid UUID' };
    }
    validatedTrackId = trackId;
  }

  // Validate listenerId - optional, but if provided must be UUID
  let validatedListenerId: string | undefined;
  if (listenerId !== undefined && listenerId !== null) {
    if (typeof listenerId !== 'string') {
      return { error: 'listenerId must be a string' };
    }
    if (!UUID_REGEX.test(listenerId)) {
      return { error: 'Invalid listenerId format - must be a valid UUID' };
    }
    validatedListenerId = listenerId;
  }

  return { 
    trackId: validatedTrackId, 
    artistId, 
    listenerId: validatedListenerId 
  };
}

function toCoarseCoordinate(value: number | null): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(rawBody);
    if ('error' in validation) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { trackId, artistId, listenerId } = validation;

    // Get IP address from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const ipAddress = cfConnectingIp || forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Get user agent for device detection
    const userAgent = req.headers.get('user-agent') || '';
    
    // Parse device type from user agent
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';

    // Parse browser
    let browser = 'unknown';
    if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/edge|edg/i.test(userAgent)) browser = 'Edge';

    // Parse OS
    let os = 'unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';

    // Geolocation lookup using free IP API
    let geoData = {
      city: null,
      region: null,
      country: null,
      countryCode: null,
      latitude: null,
      longitude: null
    };

    if (ipAddress && ipAddress !== 'unknown') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,lat,lon`);
        if (geoResponse.ok) {
          const geoJson = await geoResponse.json();
          if (geoJson.status === 'success') {
            geoData = {
              city: geoJson.city,
              region: geoJson.regionName,
              country: geoJson.country,
              countryCode: geoJson.countryCode,
              latitude: geoJson.lat,
              longitude: geoJson.lon
            };
          }
        }
      } catch (geoError) {
        console.log('Geo lookup failed:', geoError);
      }
    }

    const coarseLatitude = toCoarseCoordinate(geoData.latitude);
    const coarseLongitude = toCoarseCoordinate(geoData.longitude);

    // Insert demographics record
    const { error: insertError } = await supabase
      .from('listener_demographics')
      .insert({
        artist_id: artistId,
        listener_id: listenerId || null,
        
        city: geoData.city,
        region: geoData.region,
        country: geoData.country,
        country_code: geoData.countryCode,
        latitude: coarseLatitude,
        longitude: coarseLongitude,
        device_type: deviceType,
        browser: browser,
        os: os,
        track_id: trackId
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Update listening_history if listener is authenticated
    if (listenerId) {
      await supabase
        .from('listening_history')
        .update({
          device_type: deviceType,
          location_data: {
            city: geoData.city,
            region: geoData.region,
            country: geoData.country,
            countryCode: geoData.countryCode,
          }
        })
        .eq('user_id', listenerId)
        .eq('track_id', trackId)
        .order('played_at', { ascending: false })
        .limit(1);
    }

    // Generate tour recommendations based on listener locations
    if (artistId) {
      // Get top cities for this artist
      const { data: topCities } = await supabase
        .from('listener_demographics')
        .select('city, country, country_code')
        .eq('artist_id', artistId)
        .not('city', 'is', null);

      if (topCities && topCities.length > 0) {
        // Count by city
        const cityCounts: Record<string, { count: number; country: string; countryCode: string }> = {};
        topCities.forEach((row: any) => {
          if (row.city) {
            const key = `${row.city}, ${row.country}`;
            if (!cityCounts[key]) {
              cityCounts[key] = { count: 0, country: row.country, countryCode: row.country_code };
            }
            cityCounts[key].count++;
          }
        });

        // Get top 5 cities
        const sortedCities = Object.entries(cityCounts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5);

        // Upsert tour recommendations
        for (const [cityName, data] of sortedCities) {
          const city = cityName.split(',')[0].trim();
          const matchScore = Math.min(100, Math.round((data.count / topCities.length) * 100 * 2));
          
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const bestMonth = months[Math.floor(Math.random() * 12)];

          // Check if recommendation exists
          const { data: existing } = await supabase
            .from('tour_recommendations')
            .select('id')
            .eq('user_id', artistId)
            .eq('city', city)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('tour_recommendations')
              .update({
                match_score: matchScore,
                audience_size: `${data.count}+ listeners`
              })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('tour_recommendations')
              .insert({
                user_id: artistId,
                city: city,
                match_score: matchScore,
                reason: `${data.count}+ active listeners in this area`,
                audience_size: `${data.count}+ listeners`,
                best_month: bestMonth,
                venues: []
              });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        demographics: {
          deviceType,
          browser,
          os,
          location: geoData
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Demographics tracking error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track demographics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});