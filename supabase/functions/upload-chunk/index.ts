import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: track uploads per user
const uploadCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_CHUNKS_PER_MINUTE = 100;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = uploadCounts.get(userId);
  
  if (!userLimit || userLimit.resetTime < now) {
    uploadCounts.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (userLimit.count >= MAX_CHUNKS_PER_MINUTE) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please slow down.',
        retryAfter: 60
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }

    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const chunkData = formData.get('chunk') as File;

    if (!sessionId || isNaN(chunkIndex) || !chunkData) {
      console.error('Missing fields:', { sessionId: !!sessionId, chunkIndex, chunkData: !!chunkData });
      throw new Error('Missing required fields: sessionId, chunkIndex, or chunk');
    }

    console.log(`Processing chunk ${chunkIndex} for session ${sessionId}, size: ${chunkData.size}`);

    // Get session with row lock
    const { data: session, error: sessionError } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      throw new Error(`Invalid session: ${sessionError.message}`);
    }

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'in_progress') {
      console.warn(`Session ${sessionId} not active, status: ${session.status}`);
      throw new Error(`Session not active: ${session.status}`);
    }

    // Validate chunk index
    if (chunkIndex < 0 || chunkIndex >= session.total_chunks) {
      throw new Error(`Invalid chunk index: ${chunkIndex}, expected 0-${session.total_chunks - 1}`);
    }

    // Check if chunk already uploaded
    const existingChunks = (session.chunks_uploaded as number[]) || [];
    if (existingChunks.includes(chunkIndex)) {
      console.log(`Chunk ${chunkIndex} already uploaded, skipping`);
      return new Response(JSON.stringify({
        success: true,
        chunkIndex,
        totalUploaded: existingChunks.length,
        complete: existingChunks.length === session.total_chunks,
        skipped: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upload chunk to temporary storage with retry
    const chunkPath = `chunks/${sessionId}/${chunkIndex}`;
    let uploadSuccess = false;
    let uploadRetries = 0;
    const maxRetries = 3;

    while (!uploadSuccess && uploadRetries < maxRetries) {
      const chunkBytes = new Uint8Array(await chunkData.arrayBuffer());
      
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(chunkPath, chunkBytes, {
          contentType: 'application/octet-stream',
          upsert: true
        });

      if (!uploadError) {
        uploadSuccess = true;
      } else {
        uploadRetries++;
        console.warn(`Chunk upload retry ${uploadRetries}:`, uploadError);
        if (uploadRetries >= maxRetries) {
          throw new Error(`Storage upload failed after ${maxRetries} attempts: ${uploadError.message}`);
        }
        await new Promise(r => setTimeout(r, 1000 * uploadRetries));
      }
    }

    // Update session atomically
    const chunksUploaded = [...existingChunks, chunkIndex];
    const allChunksUploaded = chunksUploaded.length === session.total_chunks;

    const { error: updateError } = await supabase
      .from('upload_sessions')
      .update({
        chunks_uploaded: chunksUploaded,
        status: allChunksUploaded ? 'assembling' : 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('status', 'in_progress'); // Ensure session is still active

    if (updateError) {
      console.error('Session update error:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Chunk ${chunkIndex} processed in ${processingTime}ms, ${chunksUploaded.length}/${session.total_chunks} complete`);

    // If all chunks uploaded, assemble in background (non-blocking)
    if (allChunksUploaded) {
      console.log(`All chunks uploaded for session ${sessionId}, starting assembly`);
      assembleFile(sessionId, session, user.id).catch(err =>
        console.error('Background assembly failed:', err)
      );
    }

    return new Response(JSON.stringify({
      success: true,
      chunkIndex,
      totalUploaded: chunksUploaded.length,
      totalChunks: session.total_chunks,
      complete: allChunksUploaded,
      processingTimeMs: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Upload chunk error after', processingTime, 'ms:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Upload failed',
      processingTimeMs: processingTime
    }), {
      status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function assembleFile(sessionId: string, session: any, userId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const startTime = Date.now();

  try {
    console.log(`Assembling file for session ${sessionId}, ${session.total_chunks} chunks`);

    // Update status to assembling
    await supabase
      .from('upload_sessions')
      .update({ status: 'assembling' })
      .eq('id', sessionId);

    // Download all chunks with retry logic
    const chunks: Uint8Array[] = [];
    
    for (let i = 0; i < session.total_chunks; i++) {
      const chunkPath = `chunks/${sessionId}/${i}`;
      let downloaded = false;
      let retries = 0;

      while (!downloaded && retries < 3) {
        const { data, error } = await supabase.storage
          .from('audio-files')
          .download(chunkPath);

        if (!error && data) {
          chunks.push(new Uint8Array(await data.arrayBuffer()));
          downloaded = true;
        } else {
          retries++;
          console.warn(`Chunk ${i} download retry ${retries}:`, error);
          if (retries >= 3) {
            throw new Error(`Failed to download chunk ${i}: ${error?.message}`);
          }
          await new Promise(r => setTimeout(r, 1000 * retries));
        }
      }
    }

    console.log(`Downloaded ${chunks.length} chunks, combining...`);

    // Combine chunks
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(`Combined file size: ${totalSize} bytes`);

    // Determine content type from file name
    const ext = session.file_name.split('.').pop()?.toLowerCase() || 'mp3';
    const contentTypeMap: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aiff': 'audio/aiff',
      'aif': 'audio/aiff'
    };
    const contentType = contentTypeMap[ext] || 'audio/mpeg';

    // Upload final file with retry
    const sanitizedFileName = session.file_name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 100);
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const finalPath = `${userId}/${uniqueId}-${sanitizedFileName}`;
    
    let uploadSuccess = false;
    let retries = 0;

    while (!uploadSuccess && retries < 3) {
      const { error: uploadError } = await supabase.storage
        .from('track-files')
        .upload(finalPath, combined, {
          contentType,
          upsert: false
        });

      if (!uploadError) {
        uploadSuccess = true;
      } else {
        retries++;
        console.warn(`Final upload retry ${retries}:`, uploadError);
        if (retries >= 3) {
          throw new Error(`Failed to upload assembled file: ${uploadError.message}`);
        }
        await new Promise(r => setTimeout(r, 2000 * retries));
      }
    }

    console.log(`Final file uploaded to ${finalPath}`);

    // Clean up chunks (non-blocking, best effort)
    const cleanupPromises = [];
    for (let i = 0; i < session.total_chunks; i++) {
      const chunkPath = `chunks/${sessionId}/${i}`;
      cleanupPromises.push(
        supabase.storage.from('audio-files').remove([chunkPath])
          .catch(err => console.warn(`Failed to clean up chunk ${i}:`, err))
      );
    }
    Promise.all(cleanupPromises).catch(() => {});

    // Update session as completed
    await supabase
      .from('upload_sessions')
      .update({
        status: 'completed',
        storage_path: finalPath,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Update project if linked
    if (session.project_id) {
      await supabase
        .from('projects')
        .update({ audio_file_path: finalPath })
        .eq('id', session.project_id);
    }

    const processingTime = Date.now() - startTime;
    console.log(`File assembly complete for session ${sessionId} in ${processingTime}ms`);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Assembly error after ${processingTime}ms:`, error);
    
    await supabase
      .from('upload_sessions')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Assembly failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }
}
