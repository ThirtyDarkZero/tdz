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

    const { fileName, fileSizeBytes, projectId, chunkSizeBytes = 5242880 } = await req.json();

    if (!fileName || !fileSizeBytes) {
      throw new Error('Missing required fields');
    }

    const totalChunks = Math.ceil(fileSizeBytes / chunkSizeBytes);

    const { data: session, error } = await supabase
      .from('upload_sessions')
      .insert({
        user_id: user.id,
        project_id: projectId,
        file_name: fileName,
        file_size_bytes: fileSizeBytes,
        chunk_size_bytes: chunkSizeBytes,
        total_chunks: totalChunks,
        status: 'in_progress',
        chunks_uploaded: []
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      sessionId: session.id,
      totalChunks,
      chunkSizeBytes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create session error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to create session'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
