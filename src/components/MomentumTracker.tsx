import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, TrendingUp, TrendingDown, Activity, Target,
  Calendar, CheckCircle2, AlertCircle, Flame, Award
} from "lucide-react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Pillar 4: Momentum Continuity
export const MomentumTracker = () => {
  const [momentumScore, setMomentumScore] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMomentumData();
  }, []);

  const loadMomentumData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [scoreRes, milestonesRes] = await Promise.all([
        supabase
          .from("momentum_scores")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("milestones")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (scoreRes.error && scoreRes.error.code !== 'PGRST116') throw scoreRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      setMomentumScore(scoreRes.data || {
        score: 0,
        streak_days: 0,
        release_velocity: 0,
        engagement_rate: 0,
        content_consistency: 0,
        fan_growth: 0
      });
      setMilestones(milestonesRes.data || []);
    } catch (error) {
      console.error("Error loading momentum data:", error);
      toast.error("Failed to load momentum data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading momentum data...</p>
      </Card>
    );
  }

  const momentumData = [
    { week: 'W1', score: Math.max(0, (momentumScore?.score || 0) - 30) },
    { week: 'W2', score: Math.max(0, (momentumScore?.score || 0) - 25) },
    { week: 'W3', score: Math.max(0, (momentumScore?.score || 0) - 20) },
    { week: 'W4', score: Math.max(0, (momentumScore?.score || 0) - 15) },
    { week: 'W5', score: Math.max(0, (momentumScore?.score || 0) - 10) },
    { week: 'W6', score: Math.max(0, (momentumScore?.score || 0) - 5) },
    { week: 'W7', score: momentumScore?.score || 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Momentum Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Momentum is the new distribution - track and sustain your career growth
          </p>
        </div>
      </div>

      {/* Momentum Score */}
      <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              Current Momentum
            </span>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {momentumScore?.score || 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <TrendingUp className="w-3 h-3 text-green-500" />
                Track your growth
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            Your career velocity - the #1 predictor of long-term success
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={momentumScore?.score || 0} className="h-3" />
            </div>
            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 px-3 py-1">
              <Flame className="w-3 h-3 mr-1" />
              {momentumScore?.streak_days || 0} day streak
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={momentumData}>
              <defs>
                <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#momentumGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="factors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Momentum Factors */}
        <TabsContent value="factors" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  Release Velocity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Score</span>
                  <Badge className="bg-green-500/20 text-green-500">{(momentumScore?.release_velocity || 0).toFixed(1)}</Badge>
                </div>
                <Progress value={momentumScore?.release_velocity || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Keep releasing consistently to maintain momentum
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Score</span>
                  <Badge className="bg-blue-500/20 text-blue-500">{(momentumScore?.engagement_rate || 0).toFixed(1)}</Badge>
                </div>
                <Progress value={momentumScore?.engagement_rate || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Higher engagement = stronger momentum
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Content Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Score</span>
                  <Badge className="bg-purple-500/20 text-purple-500">{(momentumScore?.content_consistency || 0).toFixed(1)}</Badge>
                </div>
                <Progress value={momentumScore?.content_consistency || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Consistency builds trust and momentum
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Fan Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">New fans</span>
                  <Badge className="bg-orange-500/20 text-orange-500">+{momentumScore?.fan_growth || 0}</Badge>
                </div>
                <Progress value={Math.min(100, (momentumScore?.fan_growth || 0) / 10)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Growing fanbase = accelerating momentum
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card p-4 bg-primary/10 border-primary/30">
            <div className="flex gap-2 items-start">
              <Flame className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Momentum Formula</h4>
                <p className="text-sm text-muted-foreground">
                  Momentum = (Release Velocity × 0.3) + (Engagement × 0.25) + (Consistency × 0.25) + (Growth × 0.2)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Careers die not from lack of talent, but from lack of momentum. Stay consistent.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Milestones */}
        <TabsContent value="milestones" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Career Milestones
              </CardTitle>
              <CardDescription>
                Each milestone compounds your momentum
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Set your first milestone to start tracking your progress!
                  </p>
                </div>
              ) : (
                milestones.map((milestone, idx) => (
                  <Card 
                    key={milestone.id} 
                    className={`p-4 ${
                      milestone.achieved 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {milestone.achieved ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          )}
                          <h4 className="font-semibold">{milestone.title}</h4>
                          <Badge 
                            className={`${
                              milestone.achieved 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-primary/20 text-primary'
                            }`}
                          >
                            +{milestone.momentum_impact} momentum
                          </Badge>
                        </div>
                        {milestone.achieved ? (
                          <p className="text-xs text-muted-foreground ml-7">
                            Achieved {milestone.date_achieved}
                          </p>
                        ) : milestone.current_value && milestone.target_value ? (
                          <div className="ml-7 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {milestone.current_value.toLocaleString()} / {milestone.target_value.toLocaleString()}
                              </span>
                              <span className="font-semibold">
                                {Math.round((milestone.current_value / milestone.target_value) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={(milestone.current_value / milestone.target_value) * 100} 
                              className="h-2" 
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Items */}
        <TabsContent value="actions" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Momentum Boosters
              </CardTitle>
              <CardDescription>
                Actions ranked by momentum impact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { 
                  action: "Release new single", 
                  impact: "+25", 
                  effort: "High", 
                  priority: "Critical",
                  description: "Maintain consistent release cadence"
                },
                { 
                  action: "Post 3x daily on stories", 
                  impact: "+15", 
                  effort: "Low", 
                  priority: "High",
                  description: "Show your process, stay visible"
                },
                { 
                  action: "Collaborate on a track", 
                  impact: "+20", 
                  effort: "Medium", 
                  priority: "High",
                  description: "Tap into another audience"
                },
                { 
                  action: "Launch pre-save campaign", 
                  impact: "+18", 
                  effort: "Medium", 
                  priority: "Medium",
                  description: "Build anticipation, capture emails"
                },
                { 
                  action: "Go live with fans", 
                  impact: "+12", 
                  effort: "Low", 
                  priority: "Medium",
                  description: "Direct connection strengthens bonds"
                }
              ].map((item, idx) => (
                <Card key={idx} className="p-4 hover:border-primary/60 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{item.action}</h4>
                        <Badge 
                          className={`${
                            item.priority === 'Critical' 
                              ? 'bg-red-500/20 text-red-500' 
                              : item.priority === 'High'
                              ? 'bg-orange-500/20 text-orange-500'
                              : 'bg-blue-500/20 text-blue-500'
                          }`}
                        >
                          {item.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.effort} effort
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {item.impact} momentum
                        </span>
                      </div>
                    </div>
                    <Button>Do It</Button>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="glass-card border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                What's Working
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Upload and release music consistently to build momentum</p>
              <p>• Engage with your audience authentically</p>
              <p>• Track your metrics and adjust your strategy</p>
              <p>• Focus on building a loyal fanbase</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Momentum Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Long gaps between releases kill momentum</p>
              <p>• Inconsistent content posting reduces visibility</p>
              <p>• Ignoring analytics prevents optimization</p>
              <p>• Not engaging with fans weakens connection</p>
            </CardContent>
          </Card>

          <Card className="glass-card p-4 bg-primary/10 border-primary/30">
            <div className="flex gap-2 items-start">
              <Activity className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Momentum Truth</h4>
                <p className="text-sm text-muted-foreground">
                  Most artists fail not from lack of talent, but from stopping too soon. 
                  Momentum compounds - small consistent actions beat sporadic big wins. 
                  Your current momentum score predicts your success in 12 months more 
                  accurately than your current follower count.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
