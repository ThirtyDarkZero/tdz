import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, Download, Zap, Heart, AlertCircle, CheckCircle2, 
  FileVideo, Film, Radio, Type, Package, History 
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PipelineStatus {
  tempoAnalyzed: boolean;
  lyricsAligned: boolean;
  scenesGenerated: boolean;
  videosRendered: boolean;
  readyForExport: boolean;
}

export const ProductionPipeline = () => {
  const projectContext = useProject();
  const { currentProject, scenes } = projectContext || { currentProject: null, scenes: [] };
  const [status, setStatus] = useState<PipelineStatus>({
    tempoAnalyzed: false,
    lyricsAligned: false,
    scenesGenerated: false,
    videosRendered: false,
    readyForExport: false,
  });
  const [credits, setCredits] = useState(0);
  const [providerHealth, setProviderHealth] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadPipelineStatus();
      loadCredits();
    }
    loadProviderHealth();
  }, [currentProject]);

  const loadPipelineStatus = async () => {
    if (!currentProject) return;

    try {
      // Check tempo analysis
      const { data: tempo } = await supabase
        .from('tempo_maps')
        .select('id')
        .eq('project_id', currentProject.id)
        .maybeSingle();

      // Check lyric alignment
      const { data: lyrics } = await supabase
        .from('lyric_alignments')
        .select('id')
        .eq('project_id', currentProject.id)
        .limit(1);

      // Check scene videos
      const videosRendered = scenes.every(s => s.generated_video_url);

      setStatus({
        tempoAnalyzed: !!tempo,
        lyricsAligned: !!lyrics?.length,
        scenesGenerated: scenes.length > 0,
        videosRendered,
        readyForExport: videosRendered && scenes.length > 0,
      });
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const loadCredits = async () => {
    try {
      const { data } = await supabase
        .from('render_credits')
        .select('balance')
        .maybeSingle();

      setCredits(data?.balance || 0);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const loadProviderHealth = async () => {
    try {
      const { data } = await supabase
        .from('provider_health')
        .select('*')
        .order('provider_name');

      setProviderHealth(data || []);
    } catch (error) {
      console.error('Error loading provider health:', error);
    }
  };

  const runFullPipeline = async () => {
    if (!currentProject || !currentProject.audio_file_path) {
      toast.error('Audio file required');
      return;
    }

    setProcessing(true);

    try {
      // B) Tempo Analysis
      if (!status.tempoAnalyzed) {
        toast.info('Analyzing tempo...', { description: 'Extracting beat grid (±33ms accuracy)' });
        
        const { error: tempoError } = await supabase.functions.invoke('analyze-tempo', {
          body: { 
            projectId: currentProject.id, 
            audioPath: currentProject.audio_file_path 
          }
        });

        if (tempoError) throw new Error(`Tempo analysis failed: ${tempoError.message}`);
        toast.success('Beat grid generated!');
      }

      // C) Lyric Alignment
      if (!status.lyricsAligned && currentProject.lyrics) {
        toast.info('Aligning lyrics...', { description: 'Phoneme-level alignment (±250ms accuracy)' });
        
        const { error: alignError } = await supabase.functions.invoke('align-lyrics', {
          body: { 
            projectId: currentProject.id, 
            audioPath: currentProject.audio_file_path,
            lyrics: currentProject.lyrics
          }
        });

        if (alignError) throw new Error(`Lyric alignment failed: ${alignError.message}`);
        toast.success('Lyrics aligned to audio!');
      }

      // Reload status
      await loadPipelineStatus();
      toast.success('Production pipeline ready!', { 
        description: 'All systems operational' 
      });

    } catch (error) {
      console.error('Pipeline error:', error);
      toast.error('Pipeline failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportVideo = async (format: 'prores_4k' | 'h265_9x16' | 'preview_1080p') => {
    if (!currentProject) return;

    try {
      toast.info(`Exporting ${format}...`, { description: 'This may take several minutes' });

      const { data, error } = await supabase.functions.invoke('export-video', {
        body: {
          projectId: currentProject.id,
          format,
          includeTimeline: true,
          includeCaptions: true
        }
      });

      if (error) throw error;

      toast.success('Export queued!', {
        description: `Export ID: ${data.exportId}`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  const createSnapshot = async () => {
    if (!currentProject) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-version', {
        body: { projectId: currentProject.id }
      });

      if (error) throw error;

      toast.success('Version snapshot created!', {
        description: `Version ${data.version.version_number}`
      });
    } catch (error) {
      console.error('Version error:', error);
      toast.error('Failed to create snapshot');
    }
  };

  if (!currentProject) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No project selected</p>
      </div>
    );
  }

  const progressValue = Object.values(status).filter(Boolean).length * 20;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            Production Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Professional-grade music video production
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            {credits} credits
          </Badge>
          <Button onClick={createSnapshot} variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            Snapshot
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Pipeline Progress</span>
          <span className="text-sm text-muted-foreground">{progressValue}%</span>
        </div>
        <Progress value={progressValue} className="mb-4" />
        
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Tempo', icon: Radio, status: status.tempoAnalyzed },
            { label: 'Lyrics', icon: Type, status: status.lyricsAligned },
            { label: 'Scenes', icon: Film, status: status.scenesGenerated },
            { label: 'Videos', icon: FileVideo, status: status.videosRendered },
            { label: 'Ready', icon: CheckCircle2, status: status.readyForExport },
          ].map((step, idx) => (
            <div key={idx} className="text-center">
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                step.status ? 'bg-green-500/20 text-green-500' : 'bg-muted'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className="text-xs">{step.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Processing
          </h3>
          <Button 
            onClick={runFullPipeline}
            disabled={processing || !currentProject.audio_file_path}
            className="w-full mb-3"
          >
            {processing ? 'Processing...' : 'Run Full Pipeline'}
          </Button>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant={status.tempoAnalyzed ? "default" : "secondary"} className="text-[10px]">
                ±33ms
              </Badge>
              Beat-accurate cutting
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.lyricsAligned ? "default" : "secondary"} className="text-[10px]">
                ±250ms
              </Badge>
              Lyric caption timing
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-accent" />
            Export
          </h3>
          <div className="space-y-2">
            <Button
              onClick={() => exportVideo('preview_1080p')}
              disabled={!status.readyForExport}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              Preview (1080p)
            </Button>
            <Button
              onClick={() => exportVideo('prores_4k')}
              disabled={!status.readyForExport}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              ProRes 4K + Timeline
            </Button>
            <Button
              onClick={() => exportVideo('h265_9x16')}
              disabled={!status.readyForExport}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              H.265 9:16 + Captions
            </Button>
          </div>
        </Card>
      </div>

      {/* Provider Health */}
      <Card className="glass-card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Provider Health
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {providerHealth.map((provider) => (
            <div key={provider.provider_name} className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                provider.status === 'healthy' ? 'bg-green-500' :
                provider.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-xs capitalize">{provider.provider_name}</span>
              {provider.avg_response_time_ms && (
                <div className="text-[10px] text-muted-foreground">
                  {provider.avg_response_time_ms}ms
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
