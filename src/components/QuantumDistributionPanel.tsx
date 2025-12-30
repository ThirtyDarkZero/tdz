import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Zap, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb,
  TrendingUp,
  Music,
  Calendar,
  RefreshCw,
  Brain,
  Rocket,
  Shield,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuantumDistributionPanelProps {
  trackId: string;
  trackTitle?: string;
  onComplete?: () => void;
}

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'complete' | 'error';
  data?: any;
}

export function QuantumDistributionPanel({ trackId, trackTitle, onComplete }: QuantumDistributionPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'analysis', label: 'Track Analysis', icon: <Brain className="w-4 h-4" />, status: 'pending' },
    { id: 'enrichment', label: 'Metadata Enrichment', icon: <Sparkles className="w-4 h-4" />, status: 'pending' },
    { id: 'validation', label: 'Distribution Validation', icon: <Shield className="w-4 h-4" />, status: 'pending' },
    { id: 'optimization', label: 'Release Optimization', icon: <Rocket className="w-4 h-4" />, status: 'pending' }
  ]);

  const runFullPipeline = async () => {
    setIsRunning(true);
    setResults(null);

    // Reset stages
    setStages(prev => prev.map(s => ({ ...s, status: 'pending' as const, data: undefined })));

    const stageOrder = ['analysis', 'enrichment', 'validation', 'optimization'];

    for (const stageId of stageOrder) {
      setCurrentStage(stageId);
      setStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, status: 'running' as const } : s
      ));

      await new Promise(r => setTimeout(r, 500)); // Visual delay
    }

    try {
      const { data, error } = await supabase.functions.invoke('quantum-distribution', {
        body: { action: 'full-pipeline', trackId }
      });

      if (error) throw error;

      // Update stages with results
      setStages(prev => prev.map(s => {
        const stageData = data.stages?.[s.id];
        return {
          ...s,
          status: stageData?.success || stageData?.validation?.isValid ? 'complete' as const : 
                  stageData?.error ? 'error' as const : 'complete' as const,
          data: stageData
        };
      }));

      setResults(data);
      
      if (data.overallReadiness?.readyForDistribution) {
        toast.success("Track ready for distribution!", {
          description: `Quantum readiness score: ${data.overallReadiness.score}%`
        });
      } else {
        toast.warning("Track needs attention", {
          description: "Review the validation results below"
        });
      }

      onComplete?.();
    } catch (error: any) {
      console.error('Pipeline error:', error);
      toast.error("Pipeline failed", { description: error.message });
      setStages(prev => prev.map(s => 
        s.status === 'running' ? { ...s, status: 'error' as const } : s
      ));
    } finally {
      setIsRunning(false);
      setCurrentStage(null);
    }
  };

  const runSingleStage = async (action: string) => {
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('quantum-distribution', {
        body: { action, trackId }
      });

      if (error) throw error;

      setStages(prev => prev.map(s => 
        s.id === action ? { ...s, status: 'complete' as const, data } : s
      ));

      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} complete`);
    } catch (error: any) {
      toast.error("Stage failed", { description: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const overallScore = results?.overallReadiness?.score || 0;
  const analysisData = results?.stages?.analysis?.analysis;
  const enrichmentData = results?.stages?.enrichment?.enrichment;
  const validationData = results?.stages?.validation?.validation;
  const optimizationData = results?.stages?.optimization?.optimization;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Quantum Distribution
              </h2>
              <p className="text-sm text-muted-foreground">
                AI-Powered End-to-End Distribution Intelligence
              </p>
            </div>
          </div>
          <Button
            onClick={runFullPipeline}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary via-accent to-primary shadow-glow"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Full Pipeline
              </>
            )}
          </Button>
        </div>

        {trackTitle && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Analyzing:</span>
            <span className="font-medium">{trackTitle}</span>
          </div>
        )}
      </div>

      {/* Pipeline Stages */}
      <div className="p-4 border-b border-border/50">
        <div className="grid grid-cols-4 gap-3">
          {stages.map((stage, index) => (
            <button
              key={stage.id}
              onClick={() => !isRunning && runSingleStage(stage.id)}
              disabled={isRunning}
              className={cn(
                "p-3 rounded-xl border transition-all duration-300 text-left",
                stage.status === 'complete' && "border-green-500/50 bg-green-500/10",
                stage.status === 'running' && "border-primary/50 bg-primary/10 animate-pulse",
                stage.status === 'error' && "border-red-500/50 bg-red-500/10",
                stage.status === 'pending' && "border-border hover:border-primary/50 hover:bg-primary/5",
                currentStage === stage.id && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  stage.status === 'complete' && "text-green-500",
                  stage.status === 'running' && "text-primary",
                  stage.status === 'error' && "text-red-500"
                )}>
                  {stage.status === 'complete' ? <CheckCircle2 className="w-4 h-4" /> : stage.icon}
                </span>
                <span className="text-xs font-medium">{stage.label}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {stage.status === 'running' ? 'Processing...' : 
                 stage.status === 'complete' ? 'Complete' :
                 stage.status === 'error' ? 'Failed' : 'Click to run'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="p-4">
          {/* Overall Score */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Distribution Readiness</span>
              <Badge variant={overallScore >= 75 ? "default" : overallScore >= 50 ? "secondary" : "destructive"}>
                {overallScore}%
              </Badge>
            </div>
            <Progress value={overallScore} className="h-3" />
            <div className="flex items-center gap-2 mt-3">
              {results.overallReadiness?.readyForDistribution ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Ready for Distribution</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-500">Requires Attention</span>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="analysis" className="text-xs">
                <Brain className="w-3 h-3 mr-1" /> Analysis
              </TabsTrigger>
              <TabsTrigger value="enrichment" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" /> Metadata
              </TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">
                <Shield className="w-3 h-3 mr-1" /> Validation
              </TabsTrigger>
              <TabsTrigger value="optimization" className="text-xs">
                <Rocket className="w-3 h-3 mr-1" /> Release
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[300px]">
              <TabsContent value="analysis" className="space-y-4 mt-0">
                {analysisData ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Primary Genre</div>
                        <div className="font-medium">{analysisData.primaryGenre}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Mood</div>
                        <div className="font-medium capitalize">{analysisData.mood}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Energy Level</div>
                        <div className="font-medium">{analysisData.energy}/10</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Readiness</div>
                        <div className="font-medium">{analysisData.distributionReadiness}%</div>
                      </div>
                    </div>

                    {analysisData.subGenres?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Sub-Genres</div>
                        <div className="flex flex-wrap gap-1">
                          {analysisData.subGenres.map((g: string) => (
                            <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisData.similarArtists?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Similar Artists</div>
                        <div className="flex flex-wrap gap-1">
                          {analysisData.similarArtists.map((a: string) => (
                            <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisData.marketingAngles?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Marketing Angles
                        </div>
                        <ul className="space-y-1">
                          {analysisData.marketingAngles.map((angle: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">• {angle}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Run pipeline to see analysis results
                  </div>
                )}
              </TabsContent>

              <TabsContent value="enrichment" className="space-y-4 mt-0">
                {enrichmentData ? (
                  <>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Store Description</div>
                      <div className="text-sm">{enrichmentData.storeDescription}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Language</div>
                        <div className="font-medium">{enrichmentData.detectedLanguage}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Explicit</div>
                        <div className="font-medium">{enrichmentData.isExplicit ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    {enrichmentData.moodTags?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Mood Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {enrichmentData.moodTags.map((t: string) => (
                            <Badge key={t} className="text-xs bg-gradient-to-r from-primary/20 to-accent/20">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {enrichmentData.socialHashtags?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Social Hashtags</div>
                        <div className="flex flex-wrap gap-1">
                          {enrichmentData.socialHashtags.map((h: string) => (
                            <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {enrichmentData.playlistSuggestions?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Playlist Targets</div>
                        <ul className="space-y-1">
                          {enrichmentData.playlistSuggestions.map((p: string, i: number) => (
                            <li key={i} className="text-sm">• {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Run pipeline to see enrichment results
                  </div>
                )}
              </TabsContent>

              <TabsContent value="validation" className="space-y-4 mt-0">
                {validationData ? (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="font-medium">Validation Score</span>
                      <Badge variant={validationData.score >= 80 ? "default" : "secondary"}>
                        {validationData.score}/100
                      </Badge>
                    </div>

                    {validationData.blockers?.length > 0 && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="text-xs font-medium text-red-500 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Blockers
                        </div>
                        <ul className="space-y-1">
                          {validationData.blockers.map((b: string, i: number) => (
                            <li key={i} className="text-sm text-red-400">• {b}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationData.warnings?.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="text-xs font-medium text-amber-500 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Warnings
                        </div>
                        <ul className="space-y-1">
                          {validationData.warnings.map((w: string, i: number) => (
                            <li key={i} className="text-sm text-amber-400">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationData.suggestions?.length > 0 && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-xs font-medium text-blue-500 mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Suggestions
                        </div>
                        <ul className="space-y-1">
                          {validationData.suggestions.map((s: string, i: number) => (
                            <li key={i} className="text-sm text-blue-400">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Field Checks</div>
                      <div className="grid grid-cols-2 gap-2">
                        {validationData.checks?.map((check: any) => (
                          <div 
                            key={check.field} 
                            className={cn(
                              "p-2 rounded-lg text-xs flex items-center gap-2",
                              check.status === 'pass' && "bg-green-500/10 text-green-500",
                              check.status === 'warning' && "bg-amber-500/10 text-amber-500",
                              check.status === 'fail' && "bg-red-500/10 text-red-500"
                            )}
                          >
                            {check.status === 'pass' ? <CheckCircle2 className="w-3 h-3" /> : 
                             check.status === 'warning' ? <AlertTriangle className="w-3 h-3" /> :
                             <AlertTriangle className="w-3 h-3" />}
                            {check.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Run pipeline to see validation results
                  </div>
                )}
              </TabsContent>

              <TabsContent value="optimization" className="space-y-4 mt-0">
                {optimizationData ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                        <div className="text-xs text-muted-foreground mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Best Release Day
                        </div>
                        <div className="font-bold text-primary">{optimizationData.recommendedReleaseDay}</div>
                        <div className="text-xs text-muted-foreground">{optimizationData.recommendedReleaseTime}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">
                          <BarChart3 className="w-3 h-3 inline mr-1" />
                          Confidence
                        </div>
                        <div className="font-bold">{optimizationData.confidenceScore}%</div>
                      </div>
                    </div>

                    {optimizationData.releaseReason && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-1">Why This Timing?</div>
                        <div className="text-sm">{optimizationData.releaseReason}</div>
                      </div>
                    )}

                    {optimizationData.preReleaseStrategy && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-2">Pre-Release Strategy</div>
                        <div className="text-sm mb-2">
                          Start <strong>{optimizationData.preReleaseStrategy.daysBeforeRelease}</strong> days before release
                        </div>
                        {optimizationData.preReleaseStrategy.teaserContent?.length > 0 && (
                          <ul className="space-y-1">
                            {optimizationData.preReleaseStrategy.teaserContent.map((t: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {optimizationData.platformTactics?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" /> Platform Tactics
                        </div>
                        <div className="space-y-2">
                          {optimizationData.platformTactics.map((t: any, i: number) => (
                            <div key={i} className="p-2 rounded-lg bg-muted/30 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{t.platform}</div>
                                <div className="text-xs text-muted-foreground">{t.tactic}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">P{t.priority}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {optimizationData.contentCalendar?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Content Calendar</div>
                        <ul className="space-y-1">
                          {optimizationData.contentCalendar.map((c: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">• {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Run pipeline to see optimization results
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!results && !isRunning && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready for Quantum Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Run the full AI pipeline to analyze your track, enrich metadata, 
            validate distribution requirements, and optimize your release strategy.
          </p>
          <Button
            onClick={runFullPipeline}
            className="bg-gradient-to-r from-primary via-accent to-primary shadow-glow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Quantum Distribution
          </Button>
        </div>
      )}
    </Card>
  );
}
