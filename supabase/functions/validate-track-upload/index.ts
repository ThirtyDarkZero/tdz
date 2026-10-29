import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum file size: 500MB (increased for Dolby Atmos & HD Audio)
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Allowed MIME types - includes Dolby Atmos and HD Audio formats
const ALLOWED_MIME_TYPES = [
  // Standard formats
  'audio/mpeg',      // MP3
  'audio/mp3',
  'audio/aac',       // AAC
  'audio/ogg',       // OGG
  'audio/opus',      // OPUS
  
  // HD Audio formats
  'audio/wav',       // WAV (up to 24-bit/192kHz)
  'audio/wave',
  'audio/x-wav',
  'audio/flac',      // FLAC (lossless, up to 24-bit/192kHz)
  'audio/x-flac',
  'audio/m4a',       // M4A/ALAC (Apple Lossless)
  'audio/mp4',
  'audio/x-m4a',
  
  // Dolby Atmos formats
  'audio/eac3',      // E-AC-3 (Enhanced AC-3 / Dolby Digital Plus with Atmos)
  'audio/ec3',       // EC-3
  'audio/ac4',       // AC-4 (Next-gen Dolby audio)
  'audio/vnd.dolby.dd-raw', // Dolby Digital raw
  'audio/vnd.dolby.pulse.1', // Dolby Pulse
  
  // High-resolution formats
  'audio/dsd',       // DSD (Direct Stream Digital)
  'audio/aiff',      // AIFF
  'audio/x-aiff',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { fileName, fileSize, mimeType, title, artistName } = await req.json().catch(() => ({}));

    const validationErrors: string[] = [];

    // Validate file size
    if (!fileSize || fileSize <= 0) {
      validationErrors.push('File size is required');
    } else if (fileSize > MAX_FILE_SIZE) {
      validationErrors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB (increased for Dolby Atmos & HD Audio)`);
    }

    // Validate MIME type
    if (!mimeType) {
      validationErrors.push('File type is required');
    } else if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      validationErrors.push(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Validate filename
    if (!fileName || fileName.length === 0) {
      validationErrors.push('Filename is required');
    } else if (fileName.length > 255) {
      validationErrors.push('Filename must be less than 255 characters');
    }

    // Check for malicious extensions
    const extension = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = [
      // Standard
      'mp3', 'aac', 'ogg', 'opus',
      // HD Audio
      'wav', 'flac', 'm4a', 'alac',
      // Dolby Atmos
      'ec3', 'eac3', 'ac4',
      // High-res
      'dsd', 'dsf', 'dff', 'aiff', 'aif'
    ];
    if (!extension || !allowedExtensions.includes(extension)) {
      validationErrors.push(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`);
    }

    // Validate metadata
    if (!title || title.trim().length === 0) {
      validationErrors.push('Track title is required');
    } else if (title.length > 200) {
      validationErrors.push('Track title must be less than 200 characters');
    }

    if (!artistName || artistName.trim().length === 0) {
      validationErrors.push('Artist name is required');
    } else if (artistName.length > 100) {
      validationErrors.push('Artist name must be less than 100 characters');
    }

    // Check user's storage quota (optional enhancement)
    const { count } = await supabase
      .from('tracks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const maxTracksPerUser = 1000; // Configurable limit
    if (count && count >= maxTracksPerUser) {
      validationErrors.push(`Maximum track limit reached (${maxTracksPerUser} tracks)`);
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: validationErrors
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // All validations passed
    console.log(`[Upload Validation] File validated: ${fileName} for user ${user.id}`);

    return new Response(
      JSON.stringify({
        valid: true,
        message: 'File validation successful'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Upload Validation] Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});