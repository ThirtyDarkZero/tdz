import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, Target, Calendar, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TrackAnalysisPanelProps {
  trackId: string;
  trackTitle: string;
}

interface Analysis {
  commercialPotential: string;
  targetAudience: string;
  playlistRecommendations: string[];
  genreAnalysis: string;
  moodAnalysis: string;
  marketingAngle: string;
  competitorComparison: string;
  improvementSuggestions: string[];
  releaseTiming: string;
  platformStrategy: string;
}

export const TrackAnalysisPanel = ({ trackId, trackTitle }: TrackAnalysisPanelProps) => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeTrack = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-track-metadata", {
        body: { trackId },
      });

      if (error) throw error;

      if (data.analysis) {
        setAnalysis(data.analysis);
        toast.success("Track analysis complete!");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze track");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">AI Track Analysis</h3>
        </div>
        <Button onClick={analyzeTrack} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Track
            </>
          )}
        </Button>
      </div>

      {!analysis && !loading && (
        <Alert>
          <AlertDescription>
            Get professional music industry insights powered by AI. Analyze commercial potential,
            target audience, playlist opportunities, and more.
          </AlertDescription>
        </Alert>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Commercial Potential */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Commercial Potential</h4>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.commercialPotential}</p>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Target Audience</h4>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.targetAudience}</p>
          </div>

          {/* Genre & Mood Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Genre Analysis</h4>
              <p className="text-sm text-muted-foreground">{analysis.genreAnalysis}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Mood Analysis</h4>
              <p className="text-sm text-muted-foreground">{analysis.moodAnalysis}</p>
            </div>
          </div>

          {/* Playlist Recommendations */}
          {analysis.playlistRecommendations && analysis.playlistRecommendations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Playlist Recommendations</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.playlistRecommendations.map((playlist, idx) => (
                  <Badge key={idx} variant="secondary">
                    {playlist}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Marketing Angle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Marketing Angle</h4>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.marketingAngle}</p>
          </div>

          {/* Release Timing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Release Timing</h4>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.releaseTiming}</p>
          </div>

          {/* Platform Strategy */}
          <div className="space-y-2">
            <h4 className="font-semibold">Platform Strategy</h4>
            <p className="text-sm text-muted-foreground">{analysis.platformStrategy}</p>
          </div>

          {/* Competitor Comparison */}
          <div className="space-y-2">
            <h4 className="font-semibold">Similar Artists & Tracks</h4>
            <p className="text-sm text-muted-foreground">{analysis.competitorComparison}</p>
          </div>

          {/* Improvement Suggestions */}
          {analysis.improvementSuggestions && analysis.improvementSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Improvement Suggestions</h4>
              <ul className="space-y-1">
                {analysis.improvementSuggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
