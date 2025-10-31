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

    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const chunkData = formData.get('chunk') as File;

    if (!sessionId || chunkIndex === undefined || !chunkData) {
      throw new Error('Missing required fields');
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      throw new Error('Invalid session');
    }

    if (session.status !== 'in_progress') {
      throw new Error('Session not active');
    }

    // Upload chunk to temporary storage
    const chunkPath = `chunks/${sessionId}/${chunkIndex}`;
    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(chunkPath, chunkData, {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Update session
    const chunksUploaded = [...(session.chunks_uploaded as number[] || []), chunkIndex];
    const allChunksUploaded = chunksUploaded.length === session.total_chunks;

    const { error: updateError } = await supabase
      .from('upload_sessions')
      .update({
        chunks_uploaded: chunksUploaded,
        status: allChunksUploaded ? 'assembling' : 'in_progress'
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // If all chunks uploaded, assemble in background (non-blocking)
    if (allChunksUploaded) {
      assembleFile(sessionId, session, user.id).catch(err =>
        console.error('Background assembly failed:', err)
      );
    }

    return new Response(JSON.stringify({
      success: true,
      chunkIndex,
      totalUploaded: chunksUploaded.length,
      complete: allChunksUploaded
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload chunk error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Upload failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function assembleFile(sessionId: string, session: any, userId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log(`Assembling file for session ${sessionId}`);

    // Download all chunks
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < session.total_chunks; i++) {
      const chunkPath = `chunks/${sessionId}/${i}`;
      const { data, error } = await supabase.storage
        .from('audio-files')
        .download(chunkPath);

      if (error) throw error;
      chunks.push(new Uint8Array(await data.arrayBuffer()));
    }

    // Combine chunks
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Upload final file
    const finalPath = `${userId}/${session.file_name}`;
    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(finalPath, combined, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Clean up chunks
    for (let i = 0; i < session.total_chunks; i++) {
      const chunkPath = `chunks/${sessionId}/${i}`;
      await supabase.storage.from('audio-files').remove([chunkPath]);
    }

    // Update session
    await supabase
      .from('upload_sessions')
      .update({
        status: 'completed',
        storage_path: finalPath
      })
      .eq('id', sessionId);

    // Update project if linked
    if (session.project_id) {
      await supabase
        .from('projects')
        .update({ audio_file_path: finalPath })
        .eq('id', session.project_id);
    }

    console.log(`File assembly complete for session ${sessionId}`);

  } catch (error) {
    console.error('Assembly error:', error);
    await supabase
      .from('upload_sessions')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Assembly failed'
      })
      .eq('id', sessionId);
  }
}
