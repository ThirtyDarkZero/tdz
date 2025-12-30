import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constants for upload limits
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
const MIN_CHUNK_SIZE_BYTES = 1024 * 1024; // 1MB
const MAX_CHUNK_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_CONCURRENT_SESSIONS = 5;

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
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { fileName, fileSizeBytes, projectId, chunkSizeBytes } = body;

    // Validate inputs
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('fileName is required and must be a string');
    }

    if (!fileSizeBytes || typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0) {
      throw new Error('fileSizeBytes is required and must be a positive number');
    }

    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size ${fileSizeBytes} exceeds maximum of ${MAX_FILE_SIZE_BYTES} bytes (500MB)`);
    }

    // Sanitize file name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 100);

    // Validate chunk size
    let validatedChunkSize = chunkSizeBytes || 5 * 1024 * 1024; // Default 5MB
    if (validatedChunkSize < MIN_CHUNK_SIZE_BYTES) {
      validatedChunkSize = MIN_CHUNK_SIZE_BYTES;
    }
    if (validatedChunkSize > MAX_CHUNK_SIZE_BYTES) {
      validatedChunkSize = MAX_CHUNK_SIZE_BYTES;
    }

    const totalChunks = Math.ceil(fileSizeBytes / validatedChunkSize);

    console.log(`Creating upload session for ${sanitizedFileName}, ${fileSizeBytes} bytes, ${totalChunks} chunks`);

    // Check for existing active sessions (limit concurrent uploads)
    const { data: activeSessions, error: sessionCheckError } = await supabase
      .from('upload_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    if (sessionCheckError) {
      console.error('Session check error:', sessionCheckError);
    }

    if (activeSessions && activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
      throw new Error(`Maximum ${MAX_CONCURRENT_SESSIONS} concurrent uploads allowed. Please wait for existing uploads to complete.`);
    }

    // Create session
    const { data: session, error: insertError } = await supabase
      .from('upload_sessions')
      .insert({
        user_id: user.id,
        file_name: sanitizedFileName,
        file_size_bytes: fileSizeBytes,
        total_chunks: totalChunks,
        chunk_size_bytes: validatedChunkSize,
        project_id: projectId || null,
        status: 'in_progress',
        chunks_uploaded: []
      })
      .select()
      .single();

    if (insertError) {
      console.error('Session insert error:', insertError);
      throw new Error(`Failed to create session: ${insertError.message}`);
    }

    console.log(`Created session ${session.id} for user ${user.id}`);

    return new Response(JSON.stringify({
      sessionId: session.id,
      totalChunks,
      chunkSizeBytes: validatedChunkSize,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create upload session error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to create session'
    }), {
      status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
