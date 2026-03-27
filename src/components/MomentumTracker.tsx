import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Zap, TrendingUp, TrendingDown, Activity, Target,
  Calendar, CheckCircle2, AlertCircle, Flame, Award, Plus, Sparkles, Loader2
} from "lucide-react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useArtistNarrativeContext, serializeNarrativeContext } from "@/hooks/useArtistNarrativeContext";

export const MomentumTracker = () => {
  const [momentumScore, setMomentumScore] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneTarget, setNewMilestoneTarget] = useState("");
  const [newMilestoneImpact, setNewMilestoneImpact] = useState("10");

  // AI Insights
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActions, setAiActions] = useState<string | null>(null);
  const [aiActionsLoading, setAiActionsLoading] = useState(false);

  const ctx = useArtistNarrativeContext();

  useEffect(() => {
    loadMomentumData();
  }, []);

  const loadMomentumData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load momentum score
      const { data: scoreData, error: scoreError } = await supabase
        .from("momentum_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scoreError && scoreError.code !== 'PGRST116') throw scoreError;

      // Calculate real momentum based on activity
      const realMomentum = await calculateRealMomentum(user.id);

      if (scoreData) {
        // Update existing score
        const updatedScore = {
          ...scoreData,
          ...realMomentum
        };
        
        await supabase
          .from("momentum_scores")
          .update(realMomentum)
          .eq("id", scoreData.id);
          
        setMomentumScore(updatedScore);
      } else {
        // Create new score
        const { data: newScore, error: insertError } = await supabase
          .from("momentum_scores")
          .insert({
            user_id: user.id,
            ...realMomentum
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setMomentumScore(newScore);
      }

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);
    } catch (error) {
      console.error("Error loading momentum data:", error);
      toast.error("Failed to load momentum data");
    } finally {
      setLoading(false);
    }
  };

  const calculateRealMomentum = async (userId: string) => {
    // Get tracks released in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTracks } = await supabase
      .from("tracks")
      .select("id, created_at, play_count, like_count")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Get total plays and likes
    const { data: allTracks } = await supabase
      .from("tracks")
      .select("play_count, like_count")
      .eq("user_id", userId);

    // Get follower count
    const { count: followerCount } = await supabase
      .from("artist_follows")
      .select("*", { count: "exact" })
      .eq("artist_id", userId);

    // Calculate factors
    const releaseVelocity = Math.min(100, (recentTracks?.length || 0) * 20);
    
    const totalPlays = allTracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
    const totalLikes = allTracks?.reduce((sum, t) => sum + (t.like_count || 0), 0) || 0;
    const engagementRate = totalPlays > 0 ? Math.min(100, (totalLikes / totalPlays) * 100 * 10) : 0;
    
    // Content consistency - check calendar events
    const { data: calendarEvents } = await supabase
      .from("content_calendar")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "scheduled");
    
    const contentConsistency = Math.min(100, (calendarEvents?.length || 0) * 5);
    
    // Fan growth
    const fanGrowth = followerCount || 0;

    // Calculate overall score
    const score = Math.round(
      (releaseVelocity * 0.3) + 
      (engagementRate * 0.25) + 
      (contentConsistency * 0.25) + 
      (Math.min(100, fanGrowth) * 0.2)
    );

    // Calculate streak (days with activity)
    const { data: recentActivity } = await supabase
      .from("activity_log")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    const uniqueDays = new Set(
      recentActivity?.map(a => new Date(a.created_at).toDateString()) || []
    );
    const streakDays = uniqueDays.size;

    return {
      score,
      streak_days: streakDays,
      release_velocity: releaseVelocity,
      engagement_rate: engagementRate,
      content_consistency: contentConsistency,
      fan_growth: fanGrowth
    };
  };

  const addMilestone = async () => {
    if (!newMilestoneTitle) {
      toast.error("Please enter a milestone title");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("milestones")
        .insert({
          user_id: user.id,
          title: newMilestoneTitle,
          target_value: parseInt(newMilestoneTarget) || null,
          current_value: 0,
          momentum_impact: parseInt(newMilestoneImpact),
          achieved: false
        });

      if (error) throw error;

      toast.success("Milestone added!");
      setNewMilestoneTitle("");
      setNewMilestoneTarget("");
      setShowAddMilestone(false);
      loadMomentumData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const completeMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from("milestones")
        .update({
          achieved: true,
          date_achieved: new Date().toISOString()
        })
        .eq("id", milestoneId);

      if (error) throw error;

      toast.success("Milestone completed! 🎉");
      loadMomentumData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // AI-Powered Insight Generation
  const generateAIInsight = async () => {
    setAiLoading(true);
    setAiInsight(null);
    try {
      const serialized = serializeNarrativeContext(ctx);
      const { data, error } = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "generate-content",
          narrative_context: serialized,
          content_type: "caption",
          release_phase: ctx.releaseCycle.phase,
          extra_context: `Analyze this artist's momentum data and provide a strategic career assessment:

MOMENTUM SCORE: ${momentumScore?.score || 0}/100
- Release Velocity: ${momentumScore?.release_velocity || 0}
- Engagement Rate: ${(momentumScore?.engagement_rate || 0).toFixed(1)}
- Content Consistency: ${momentumScore?.content_consistency || 0}
- Fan Growth: ${momentumScore?.fan_growth || 0}
- Activity Streak: ${momentumScore?.streak_days || 0} days

Milestones: ${milestones.length} set, ${milestones.filter(m => m.achieved).length} achieved

Provide 3-4 paragraphs of strategic analysis:
1. Current momentum assessment (what the numbers tell us)
2. Biggest opportunity right now based on their release cycle
3. Critical risk or gap that needs attention
4. Specific next action (one thing to do THIS WEEK)

Write like a label A&R meeting — direct, strategic, data-backed. Reference their actual metrics.`,
        },
      });
      if (error) throw error;
      setAiInsight(typeof data?.result === "string" ? data.result : JSON.stringify(data?.result));
    } catch (err: any) {
      toast.error(err.message || "Failed to generate insight");
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIActions = async () => {
    setAiActionsLoading(true);
    setAiActions(null);
    try {
      const serialized = serializeNarrativeContext(ctx);
      const { data, error } = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "generate-content",
          narrative_context: serialized,
          content_type: "caption",
          release_phase: ctx.releaseCycle.phase,
          extra_context: `Based on this artist's current momentum (score: ${momentumScore?.score || 0}/100), generate 5 SPECIFIC, actionable momentum boosters ranked by impact.

For each action, provide:
- The specific action (not generic — reference their actual releases, metrics, audience)
- Expected momentum impact (High/Medium/Low)
- Effort level (Low/Medium/High)
- WHY this action matters for them specifically right now

Format as a numbered list. Be direct and tactical — think label marketing meeting, not motivational poster.`,
        },
      });
      if (error) throw error;
      setAiActions(typeof data?.result === "string" ? data.result : JSON.stringify(data?.result));
    } catch (err: any) {
      toast.error(err.message || "Failed to generate actions");
    } finally {
      setAiActionsLoading(false);
    }
  };

  const performAction = async (action: string, impact: number) => {
    toast.success(`${action} - +${impact} momentum!`);
    // In a real implementation, this would trigger the actual action
    // and update momentum accordingly
  };

  if (loading) {
    return (
      <Card className="p-12 text-center bg-card/50">
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
            AI-powered career velocity tracking — your #1 predictor of long-term success
          </p>
        </div>
        <Badge variant="outline" className="ml-auto gap-1 text-xs border-primary/30 text-primary">
          <Sparkles className="w-3 h-3" /> AI Powered
        </Badge>
      </div>

      {/* Momentum Score */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
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
                {(momentumScore?.score || 0) > 50 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                {(momentumScore?.score || 0) > 50 ? "Growing" : "Needs attention"}
              </div>
            </div>
          </CardTitle>
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
          <TabsTrigger value="actions">AI Actions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Factors Tab */}
        <TabsContent value="factors" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Release Velocity", value: momentumScore?.release_velocity || 0, icon: Activity, color: "text-green-500", desc: "Tracks released in last 30 days × 20" },
              { label: "Engagement Rate", value: momentumScore?.engagement_rate || 0, icon: Target, color: "text-blue-500", desc: "Likes ÷ Plays ratio" },
              { label: "Content Consistency", value: momentumScore?.content_consistency || 0, icon: Calendar, color: "text-purple-500", desc: "Scheduled content events" },
              { label: "Fan Growth", value: momentumScore?.fan_growth || 0, icon: Zap, color: "text-orange-500", desc: "Total follower count" },
            ].map((factor) => (
              <Card key={factor.label} className="bg-card/50 border-border/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <factor.icon className={`w-4 h-4 ${factor.color}`} />
                    {factor.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Score</span>
                    <Badge variant="outline">{factor.value.toFixed(0)}</Badge>
                  </div>
                  <Progress value={Math.min(100, factor.value)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{factor.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Career Milestones
                </span>
                <Button size="sm" onClick={() => setShowAddMilestone(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Milestone
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddMilestone && (
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <div className="space-y-3">
                    <div>
                      <Label>Milestone Title</Label>
                      <Input
                        placeholder="e.g., Reach 1,000 streams"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Target Value</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 1000"
                          value={newMilestoneTarget}
                          onChange={(e) => setNewMilestoneTarget(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Impact</Label>
                        <Input
                          type="number"
                          value={newMilestoneImpact}
                          onChange={(e) => setNewMilestoneImpact(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addMilestone} className="flex-1">Add</Button>
                      <Button variant="outline" onClick={() => setShowAddMilestone(false)}>Cancel</Button>
                    </div>
                  </div>
                </Card>
              )}

              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Set your first milestone!</p>
                </div>
              ) : (
                milestones.map((m) => (
                  <Card 
                    key={m.id} 
                    className={`p-4 ${
                      m.achieved 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-border/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {m.achieved ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <div 
                              className="w-5 h-5 rounded-full border-2 border-muted cursor-pointer hover:border-primary"
                              onClick={() => completeMilestone(m.id)}
                            />
                          )}
                          <h4 className="font-semibold">{m.title}</h4>
                          <Badge 
                            variant="outline"
                            className="text-xs"
                          >
                            +{m.momentum_impact}
                          </Badge>
                        </div>
                        {m.achieved ? (
                          <p className="text-xs text-muted-foreground ml-7">
                            Achieved {new Date(m.date_achieved).toLocaleDateString()}
                          </p>
                        ) : m.target_value ? (
                          <div className="ml-7 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {(m.current_value || 0).toLocaleString()} / {m.target_value.toLocaleString()}
                              </span>
                              <span className="font-semibold">
                                {Math.round(((m.current_value || 0) / m.target_value) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={((m.current_value || 0) / m.target_value) * 100} 
                              className="h-2" 
                            />
                          </div>
                        ) : !m.achieved && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="ml-7 mt-2"
                            onClick={() => completeMilestone(m.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                AI Momentum Boosters
              </CardTitle>
              <CardDescription>
                Personalized actions ranked by impact on YOUR career — powered by your full story and metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateAIActions} disabled={aiActionsLoading} className="w-full gap-2">
                {aiActionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiActionsLoading ? "Analyzing your momentum..." : "Generate AI Action Plan"}
              </Button>

              {aiActionsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: `${100 - i * 15}%` }} />)}
                </div>
              )}

              {aiActions && (
                <Card className="p-5 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI-Generated Action Plan</span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {aiActions}
                  </div>
                </Card>
              )}

              {!aiActions && !aiActionsLoading && (
                <p className="text-xs text-center text-muted-foreground">
                  AI will analyze your story, releases, metrics, and release cycle to generate specific actions
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                AI Career Intelligence
              </CardTitle>
              <CardDescription>
                Deep analysis of your momentum, release cycle, and growth trajectory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateAIInsight} disabled={aiLoading} className="w-full gap-2" variant="outline">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? "Analyzing..." : "Generate AI Career Analysis"}
              </Button>

              {aiLoading && (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: `${100 - i * 10}%` }} />)}
                </div>
              )}

              {aiInsight && (
                <Card className="p-5 bg-card/80 border-primary/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Strategic Analysis</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      Score: {momentumScore?.score || 0}/100
                    </Badge>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {aiInsight}
                  </div>
                </Card>
              )}

              {!aiInsight && !aiLoading && (
                <div className="space-y-3">
                  <Card className="p-4 bg-green-500/5 border-green-500/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500" /> What's Working
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {(momentumScore?.release_velocity || 0) > 40 && <li>• Great release velocity</li>}
                      {(momentumScore?.engagement_rate || 0) > 30 && <li>• Strong engagement rate</li>}
                      {(momentumScore?.streak_days || 0) > 7 && <li>• Impressive activity streak</li>}
                      {(momentumScore?.score || 0) === 0 && <li>• Upload your first track to start!</li>}
                    </ul>
                  </Card>
                  <Card className="p-4 bg-destructive/5 border-destructive/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-destructive" /> Risks
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {(momentumScore?.release_velocity || 0) < 20 && <li>• Low release velocity</li>}
                      {(momentumScore?.content_consistency || 0) < 30 && <li>• Content calendar empty</li>}
                      {(momentumScore?.fan_growth || 0) < 10 && <li>• Fan base needs growth</li>}
                    </ul>
                  </Card>
                  <p className="text-xs text-center text-muted-foreground">
                    Click "Generate AI Career Analysis" for a deep, personalized strategic assessment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
