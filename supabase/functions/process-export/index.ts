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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { exportId } = await req.json();
    if (!exportId) throw new Error('Export ID required');

    // Get export record
    const { data: exportRecord, error: exportError } = await supabase
      .from('exports')
      .select('*, projects(*)')
      .eq('id', exportId)
      .single();

    if (exportError || !exportRecord) throw new Error('Export not found');

    // Get all scenes with videos
    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', exportRecord.project_id)
      .order('scene_order');

    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes with videos found');
    }

    // Update status to processing
    await supabase
      .from('exports')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', exportId);

    // Start background processing (non-blocking)
    processVideoExport(exportId, exportRecord, scenes, supabase).catch(err => 
      console.error('Background export failed:', err)
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Export processing started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Process export error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processVideoExport(
  exportId: string,
  exportRecord: any,
  scenes: any[],
  supabase: any
) {
  try {
    console.log(`Starting export processing for ${exportId}`);

    // Download all scene videos
    const videoFiles: { path: string; startTime: number; duration: number }[] = [];
    
    for (const scene of scenes) {
      if (!scene.generated_video_url) continue;

      const videoPath = scene.generated_video_url.replace(
        `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/generated-videos/`,
        ''
      );

      videoFiles.push({
        path: videoPath,
        startTime: scene.start_time,
        duration: scene.end_time - scene.start_time
      });
    }

    // Use FFmpeg to compose video
    const composedVideo = await composeVideoWithFFmpeg(
      videoFiles,
      exportRecord.format,
      supabase
    );

    // Upload final video
    const outputPath = `exports/${exportRecord.user_id}/${exportId}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from('generated-videos')
      .upload(outputPath, composedVideo, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-videos')
      .getPublicUrl(outputPath);

    // Generate timeline files if requested
    let timelineData = null;
    if (exportRecord.includes_otio || exportRecord.includes_edl || exportRecord.includes_xml) {
      timelineData = generateTimelineFiles(scenes, exportRecord);
    }

    // Update export record
    await supabase
      .from('exports')
      .update({
        status: 'completed',
        file_path: urlData.publicUrl,
        file_size_bytes: composedVideo.byteLength,
        duration_seconds: scenes[scenes.length - 1].end_time,
        completed_at: new Date().toISOString(),
        metadata: timelineData
      })
      .eq('id', exportId);

    console.log(`Export ${exportId} completed successfully`);

  } catch (error) {
    console.error(`Export ${exportId} failed:`, error);
    await supabase
      .from('exports')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed'
      })
      .eq('id', exportId);
  }
}

async function composeVideoWithFFmpeg(
  videoFiles: { path: string; startTime: number; duration: number }[],
  format: string,
  supabase: any
): Promise<Uint8Array> {
  // This is a simplified version - in production, you'd use actual FFmpeg
  // via a Deno FFmpeg wrapper or external service
  
  console.log('Composing video with FFmpeg (simulated)');
  console.log(`Format: ${format}`);
  console.log(`Video files: ${videoFiles.length}`);

  // Download first video as placeholder
  // In production: use FFmpeg to concat all videos with proper timing
  const firstVideo = videoFiles[0];
  const { data, error } = await supabase.storage
    .from('generated-videos')
    .download(firstVideo.path);

  if (error) throw error;

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function generateTimelineFiles(scenes: any[], exportRecord: any) {
  const timeline: any = {
    otio: null,
    edl: null,
    xml: null
  };

  if (exportRecord.includes_otio) {
    // Generate OTIO (OpenTimelineIO) format
    timeline.otio = {
      OTIO_SCHEMA: "Timeline.1",
      name: `Export ${exportRecord.id}`,
      tracks: {
        OTIO_SCHEMA: "Stack.1",
        children: scenes.map(scene => ({
          OTIO_SCHEMA: "Clip.1",
          name: `Scene ${scene.scene_order}`,
          source_range: {
            start_time: { value: scene.start_time },
            duration: { value: scene.end_time - scene.start_time }
          }
        }))
      }
    };
  }

  if (exportRecord.includes_edl) {
    // Generate EDL format
    timeline.edl = scenes.map((scene, idx) => 
      `${String(idx + 1).padStart(3, '0')}  001      V     C        ${formatTimecode(scene.start_time)} ${formatTimecode(scene.end_time)} ${formatTimecode(scene.start_time)} ${formatTimecode(scene.end_time)}`
    ).join('\n');
  }

  if (exportRecord.includes_xml) {
    // Generate FCPXML format
    timeline.xml = `<?xml version="1.0" encoding="UTF-8"?>
<fcpxml version="1.9">
  <project name="Export ${exportRecord.id}">
    <sequence>
      ${scenes.map(scene => `
      <clip name="Scene ${scene.scene_order}" start="${scene.start_time}s" duration="${scene.end_time - scene.start_time}s"/>
      `).join('')}
    </sequence>
  </project>
</fcpxml>`;
  }

  return timeline;
}

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30); // 30fps
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}
