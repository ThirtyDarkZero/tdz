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
  Calendar, CheckCircle2, AlertCircle, Flame, Award, Plus, Sparkles, Loader2,
  Save, Download, FileText
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

  // Real activity feed
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);

  // AI Insights
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActions, setAiActions] = useState<string | null>(null);
  const [aiActionsLoading, setAiActionsLoading] = useState(false);
  const [savingStrategy, setSavingStrategy] = useState(false);

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
        const updatedScore = { ...scoreData, ...realMomentum };
        await supabase.from("momentum_scores").update(realMomentum).eq("id", scoreData.id);
        setMomentumScore(updatedScore);
      } else {
        const { data: newScore, error: insertError } = await supabase
          .from("momentum_scores")
          .insert({ user_id: user.id, ...realMomentum })
          .select()
          .single();
        if (insertError) throw insertError;
        setMomentumScore(newScore);
      }

      // Load milestones
      const { data: milestonesData } = await supabase
        .from("milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMilestones(milestonesData || []);

      // Load real activity feed
      const { data: activityData } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);
      setRecentActivity(activityData || []);

      // Build weekly history from listening_history + tracks
      await loadWeeklyHistory(user.id);
    } catch (error) {
      console.error("Error loading momentum data:", error);
      toast.error("Failed to load momentum data");
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyHistory = async (userId: string) => {
    const weeks: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      // Get streams in this week window
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("user_id", userId);
      const trackIds = tracks?.map(t => t.id) || [];

      let streams = 0;
      if (trackIds.length > 0) {
        const { count } = await supabase
          .from("listening_history")
          .select("*", { count: "exact", head: true })
          .in("track_id", trackIds)
          .gte("played_at", weekStart.toISOString())
          .lte("played_at", weekEnd.toISOString());
        streams = count || 0;
      }

      // Get new followers in this window
      const { count: newFollowers } = await supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", userId)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      // Get activity count
      const { count: activityCount } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      weeks.push({
        week: `W${7 - i}`,
        streams,
        followers: newFollowers || 0,
        activity: activityCount || 0,
        score: Math.min(100, (streams * 2) + ((newFollowers || 0) * 5) + ((activityCount || 0) * 3))
      });
    }
    setWeeklyHistory(weeks);
  };

  const calculateRealMomentum = async (userId: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTracks } = await supabase
      .from("tracks")
      .select("id, created_at, play_count, like_count")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { data: allTracks } = await supabase
      .from("tracks")
      .select("play_count, like_count")
      .eq("user_id", userId);

    const { count: followerCount } = await supabase
      .from("artist_follows")
      .select("*", { count: "exact" })
      .eq("artist_id", userId);

    // Get listening history count for last 30 days
    const trackIds = allTracks?.map((_, i) => i) || []; // placeholder
    const { data: allTrackIds } = await supabase
      .from("tracks")
      .select("id")
      .eq("user_id", userId);

    let recentStreams = 0;
    if (allTrackIds && allTrackIds.length > 0) {
      const { count } = await supabase
        .from("listening_history")
        .select("*", { count: "exact", head: true })
        .in("track_id", allTrackIds.map(t => t.id))
        .gte("played_at", thirtyDaysAgo.toISOString());
      recentStreams = count || 0;
    }

    const releaseVelocity = Math.min(100, (recentTracks?.length || 0) * 20);
    const totalPlays = allTracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
    const totalLikes = allTracks?.reduce((sum, t) => sum + (t.like_count || 0), 0) || 0;
    const engagementRate = totalPlays > 0 ? Math.min(100, (totalLikes / totalPlays) * 100 * 10) : 0;

    // Stream momentum (recent streams count)
    const streamMomentum = Math.min(100, recentStreams * 2);

    const { data: calendarEvents } = await supabase
      .from("content_calendar")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "scheduled");
    const contentConsistency = Math.min(100, (calendarEvents?.length || 0) * 5);
    const fanGrowth = followerCount || 0;

    const score = Math.round(
      (releaseVelocity * 0.2) +
      (engagementRate * 0.2) +
      (contentConsistency * 0.15) +
      (Math.min(100, fanGrowth) * 0.15) +
      (streamMomentum * 0.3)
    );

    const { data: recentActivityData } = await supabase
      .from("activity_log")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    const uniqueDays = new Set(recentActivityData?.map(a => new Date(a.created_at).toDateString()) || []);

    return {
      score,
      streak_days: uniqueDays.size,
      release_velocity: releaseVelocity,
      engagement_rate: engagementRate,
      content_consistency: contentConsistency,
      fan_growth: fanGrowth
    };
  };

  const addMilestone = async () => {
    if (!newMilestoneTitle) { toast.error("Please enter a milestone title"); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("milestones").insert({
        user_id: user.id, title: newMilestoneTitle,
        target_value: parseInt(newMilestoneTarget) || null,
        current_value: 0, momentum_impact: parseInt(newMilestoneImpact), achieved: false
      });
      if (error) throw error;
      toast.success("Milestone added!");
      setNewMilestoneTitle(""); setNewMilestoneTarget(""); setShowAddMilestone(false);
      loadMomentumData();
    } catch (error: any) { toast.error(error.message); }
  };

  const completeMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase.from("milestones")
        .update({ achieved: true, date_achieved: new Date().toISOString() })
        .eq("id", milestoneId);
      if (error) throw error;
      toast.success("Milestone completed! 🎉");
      loadMomentumData();
    } catch (error: any) { toast.error(error.message); }
  };

  const saveStrategy = async (content: string, type: string) => {
    setSavingStrategy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("saved_strategies").insert({
        user_id: user.id,
        strategy_type: type,
        title: `${type} Analysis - ${new Date().toLocaleDateString()}`,
        content,
        metadata: { momentum_score: momentumScore?.score, streak: momentumScore?.streak_days }
      });
      if (error) throw error;
      toast.success("Strategy saved!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingStrategy(false); }
  };

  const exportStrategy = (content: string, type: string) => {
    const blob = new Blob([`# ${type} Strategy Report\nGenerated: ${new Date().toLocaleString()}\n\nMomentum Score: ${momentumScore?.score || 0}/100\nStreak: ${momentumScore?.streak_days || 0} days\n\n---\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${type.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.md`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Strategy exported!");
  };

  const generateAIInsight = async () => {
    setAiLoading(true); setAiInsight(null);
    try {
      const serialized = serializeNarrativeContext(ctx);
      const { data, error } = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "generate-content", narrative_context: serialized,
          content_type: "caption", release_phase: ctx.releaseCycle.phase,
          extra_context: `Analyze this artist's momentum data and provide a strategic career assessment:

MOMENTUM SCORE: ${momentumScore?.score || 0}/100
- Release Velocity: ${momentumScore?.release_velocity || 0}
- Engagement Rate: ${(momentumScore?.engagement_rate || 0).toFixed(1)}
- Content Consistency: ${momentumScore?.content_consistency || 0}
- Fan Growth: ${momentumScore?.fan_growth || 0}
- Activity Streak: ${momentumScore?.streak_days || 0} days
- Weekly Stream History: ${weeklyHistory.map(w => `${w.week}: ${w.streams} streams, ${w.followers} new followers`).join("; ")}
- Recent Activity: ${recentActivity.slice(0, 5).map(a => `${a.activity_type} on ${new Date(a.created_at).toLocaleDateString()}`).join(", ")}

Milestones: ${milestones.length} set, ${milestones.filter(m => m.achieved).length} achieved

Provide 3-4 paragraphs of strategic analysis referencing actual metrics.`,
        },
      });
      if (error) throw error;
      setAiInsight(typeof data?.result === "string" ? data.result : JSON.stringify(data?.result));
    } catch (err: any) { toast.error(err.message || "Failed to generate insight"); }
    finally { setAiLoading(false); }
  };

  const generateAIActions = async () => {
    setAiActionsLoading(true); setAiActions(null);
    try {
      const serialized = serializeNarrativeContext(ctx);
      const { data, error } = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "generate-content", narrative_context: serialized,
          content_type: "caption", release_phase: ctx.releaseCycle.phase,
          extra_context: `Based on this artist's current momentum (score: ${momentumScore?.score || 0}/100), weekly streams: ${weeklyHistory.map(w => `${w.week}=${w.streams}`).join(",")}, generate 5 SPECIFIC, actionable momentum boosters ranked by impact. Format as a numbered list.`,
        },
      });
      if (error) throw error;
      setAiActions(typeof data?.result === "string" ? data.result : JSON.stringify(data?.result));
    } catch (err: any) { toast.error(err.message || "Failed to generate actions"); }
    finally { setAiActionsLoading(false); }
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      track_upload: "🎵 Uploaded a track",
      album_created: "💿 Created album",
      track_published: "🚀 Published track",
      profile_updated: "✏️ Updated profile",
      campaign_created: "📢 Launched campaign",
      event_created: "🎤 Created tour event",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card className="p-12 text-center bg-card/50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ fontFamily: "'Raleway', sans-serif" }} className="text-muted-foreground">Loading momentum data...</p>
      </Card>
    );
  }

  const chartData = weeklyHistory.length > 0 ? weeklyHistory : [
    { week: 'W1', score: Math.max(0, (momentumScore?.score || 0) - 30), streams: 0 },
    { week: 'W7', score: momentumScore?.score || 0, streams: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6" style={{ color: "#00CFFF" }} />
        <div>
          <h2 style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", fontSize: "1.75rem" }}>
            Momentum Dashboard
          </h2>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: "0.8rem" }} className="text-muted-foreground">
            Real-time career velocity tracking — streams, followers, and activity
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
            <span className="flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              Current Momentum
            </span>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {momentumScore?.score || 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end" style={{ fontFamily: "'Raleway', sans-serif" }}>
                {(momentumScore?.score || 0) > 50 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                {(momentumScore?.score || 0) > 50 ? "Growing" : "Needs attention"}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1"><Progress value={momentumScore?.score || 0} className="h-3" /></div>
            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 px-3 py-1">
              <Flame className="w-3 h-3 mr-1" />
              {momentumScore?.streak_days || 0} day streak
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="streamsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00CFFF" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#00CFFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: "'Raleway', sans-serif", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" name="Score" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#momentumGradient)" />
              <Area type="monotone" dataKey="streams" name="Streams" stroke="#00CFFF" strokeWidth={1.5} fill="url(#streamsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="activity" style={{ fontFamily: "'Raleway', sans-serif" }}>Activity</TabsTrigger>
          <TabsTrigger value="factors" style={{ fontFamily: "'Raleway', sans-serif" }}>Factors</TabsTrigger>
          <TabsTrigger value="milestones" style={{ fontFamily: "'Raleway', sans-serif" }}>Milestones</TabsTrigger>
          <TabsTrigger value="actions" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Actions</TabsTrigger>
          <TabsTrigger value="insights" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Insights</TabsTrigger>
        </TabsList>

        {/* Real Activity Feed */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                <Activity className="w-5 h-5" style={{ color: "#00CFFF" }} />
                Recent Activity
              </CardTitle>
              <CardDescription style={{ fontFamily: "'Raleway', sans-serif" }}>
                Real actions driving your momentum score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
                    No activity yet. Upload tracks, create campaigns, and engage fans to build momentum!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((a, i) => (
                    <div key={a.id || i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/10">
                      <div className="text-lg">{getActivityLabel(a.activity_type).split(" ")[0]}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ fontFamily: "'Raleway', sans-serif" }}>
                          {getActivityLabel(a.activity_type).split(" ").slice(1).join(" ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()} · {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Breakdown */}
          {weeklyHistory.length > 0 && (
            <Card className="bg-card/50 border-border/30">
              <CardHeader>
                <CardTitle style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                  Weekly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weeklyHistory.map((w, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-muted/10">
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>{w.week}</p>
                      <p className="text-lg font-bold" style={{ color: "#00CFFF" }}>{w.streams}</p>
                      <p className="text-[10px] text-muted-foreground">streams</p>
                      <p className="text-xs mt-1">+{w.followers} fans</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Factors Tab */}
        <TabsContent value="factors" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Release Velocity", value: momentumScore?.release_velocity || 0, icon: Activity, color: "#22C55E", desc: "Tracks released in last 30 days" },
              { label: "Engagement Rate", value: momentumScore?.engagement_rate || 0, icon: Target, color: "#00CFFF", desc: "Likes ÷ Plays ratio" },
              { label: "Content Consistency", value: momentumScore?.content_consistency || 0, icon: Calendar, color: "#8B5CF6", desc: "Scheduled content events" },
              { label: "Fan Growth", value: momentumScore?.fan_growth || 0, icon: Zap, color: "#F97316", desc: "Total follower count" },
            ].map((factor) => (
              <Card key={factor.label} className="bg-card/50 border-border/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                    <factor.icon className="w-4 h-4" style={{ color: factor.color }} />
                    {factor.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ fontFamily: "'Raleway', sans-serif" }}>Score</span>
                    <Badge variant="outline">{factor.value.toFixed(0)}</Badge>
                  </div>
                  <Progress value={Math.min(100, factor.value)} className="h-2" />
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>{factor.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Career Milestones
                </span>
                <Button size="sm" onClick={() => setShowAddMilestone(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddMilestone && (
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <div className="space-y-3">
                    <div>
                      <Label style={{ fontFamily: "'Raleway', sans-serif" }}>Milestone Title</Label>
                      <Input placeholder="e.g., Reach 1,000 streams" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>Target Value</Label><Input type="number" placeholder="e.g., 1000" value={newMilestoneTarget} onChange={(e) => setNewMilestoneTarget(e.target.value)} /></div>
                      <div><Label style={{ fontFamily: "'Raleway', sans-serif" }}>Impact</Label><Input type="number" value={newMilestoneImpact} onChange={(e) => setNewMilestoneImpact(e.target.value)} /></div>
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
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>Set your first milestone!</p>
                </div>
              ) : milestones.map((m) => (
                <Card key={m.id} className={`p-4 ${m.achieved ? 'border-green-500/30 bg-green-500/5' : 'border-border/30'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {m.achieved ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted cursor-pointer hover:border-primary" onClick={() => completeMilestone(m.id)} />
                        )}
                        <h4 className="font-semibold" style={{ fontFamily: "'Raleway', sans-serif" }}>{m.title}</h4>
                        <Badge variant="outline" className="text-xs">+{m.momentum_impact}</Badge>
                      </div>
                      {m.achieved ? (
                        <p className="text-xs text-muted-foreground ml-7">Achieved {new Date(m.date_achieved).toLocaleDateString()}</p>
                      ) : m.target_value ? (
                        <div className="ml-7 space-y-1">
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{(m.current_value || 0).toLocaleString()} / {m.target_value.toLocaleString()}</span><span className="font-semibold">{Math.round(((m.current_value || 0) / m.target_value) * 100)}%</span></div>
                          <Progress value={((m.current_value || 0) / m.target_value) * 100} className="h-2" />
                        </div>
                      ) : !m.achieved && (
                        <Button size="sm" variant="outline" className="ml-7 mt-2" onClick={() => completeMilestone(m.id)}>Mark Complete</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                <Target className="w-5 h-5 text-primary" /> AI Momentum Boosters
              </CardTitle>
              <CardDescription style={{ fontFamily: "'Raleway', sans-serif" }}>
                Personalized actions ranked by impact — powered by your full story and metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateAIActions} disabled={aiActionsLoading} className="w-full gap-2">
                {aiActionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiActionsLoading ? "Analyzing..." : "Generate AI Action Plan"}
              </Button>
              {aiActionsLoading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: `${100 - i * 15}%` }} />)}</div>}
              {aiActions && (
                <Card className="p-5 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Action Plan</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => saveStrategy(aiActions, "Momentum Actions")} disabled={savingStrategy}>
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exportStrategy(aiActions, "Momentum Actions")}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90" style={{ fontFamily: "'Raleway', sans-serif" }}>{aiActions}</div>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                <Activity className="w-5 h-5 text-primary" /> AI Career Intelligence
              </CardTitle>
              <CardDescription style={{ fontFamily: "'Raleway', sans-serif" }}>
                Deep analysis of your momentum, release cycle, and growth trajectory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateAIInsight} disabled={aiLoading} className="w-full gap-2" variant="outline">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? "Analyzing..." : "Generate AI Career Analysis"}
              </Button>
              {aiLoading && <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: `${100 - i * 10}%` }} />)}</div>}
              {aiInsight && (
                <Card className="p-5 bg-card/80 border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Strategic Analysis</span>
                      <Badge variant="outline" className="text-[10px] ml-2">Score: {momentumScore?.score || 0}/100</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => saveStrategy(aiInsight, "Career Intelligence")} disabled={savingStrategy}>
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exportStrategy(aiInsight, "Career Intelligence")}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90" style={{ fontFamily: "'Raleway', sans-serif" }}>{aiInsight}</div>
                </Card>
              )}
              {!aiInsight && !aiLoading && (
                <div className="space-y-3">
                  <Card className="p-4 bg-green-500/5 border-green-500/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                      <TrendingUp className="w-4 h-4 text-green-500" /> What's Working
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
                      {(momentumScore?.release_velocity || 0) > 40 && <li>• Great release velocity</li>}
                      {(momentumScore?.engagement_rate || 0) > 30 && <li>• Strong engagement rate</li>}
                      {(momentumScore?.streak_days || 0) > 7 && <li>• Impressive activity streak</li>}
                      {(momentumScore?.score || 0) === 0 && <li>• Upload your first track to start!</li>}
                    </ul>
                  </Card>
                  <Card className="p-4 bg-destructive/5 border-destructive/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                      <AlertCircle className="w-4 h-4 text-destructive" /> Risks
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>
                      {(momentumScore?.release_velocity || 0) < 20 && <li>• Low release velocity</li>}
                      {(momentumScore?.content_consistency || 0) < 30 && <li>• Content calendar empty</li>}
                      {(momentumScore?.fan_growth || 0) < 10 && <li>• Fan base needs growth</li>}
                    </ul>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
