import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Zap, TrendingUp, TrendingDown, Activity, Target,
  Calendar, CheckCircle2, AlertCircle, Flame, Award, Plus
} from "lucide-react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MomentumTracker = () => {
  const [momentumScore, setMomentumScore] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneTarget, setNewMilestoneTarget] = useState("");
  const [newMilestoneImpact, setNewMilestoneImpact] = useState("10");

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

  const performAction = async (action: string, impact: number) => {
    toast.success(`${action} - +${impact} momentum!`);
    // In a real implementation, this would trigger the actual action
    // and update momentum accordingly
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
                {(momentumScore?.score || 0) > 50 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                {(momentumScore?.score || 0) > 50 ? "Growing" : "Needs attention"}
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
                  <Badge className="bg-green-500/20 text-green-500">
                    {(momentumScore?.release_velocity || 0).toFixed(0)}
                  </Badge>
                </div>
                <Progress value={momentumScore?.release_velocity || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Tracks released in last 30 days × 20
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
                  <Badge className="bg-blue-500/20 text-blue-500">
                    {(momentumScore?.engagement_rate || 0).toFixed(1)}
                  </Badge>
                </div>
                <Progress value={momentumScore?.engagement_rate || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Likes ÷ Plays ratio
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
                  <Badge className="bg-purple-500/20 text-purple-500">
                    {(momentumScore?.content_consistency || 0).toFixed(0)}
                  </Badge>
                </div>
                <Progress value={momentumScore?.content_consistency || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Scheduled content events
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
                  <span className="text-sm">Followers</span>
                  <Badge className="bg-orange-500/20 text-orange-500">
                    {momentumScore?.fan_growth || 0}
                  </Badge>
                </div>
                <Progress value={Math.min(100, momentumScore?.fan_growth || 0)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Total follower count
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
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Career Milestones
                </span>
                <Button size="sm" onClick={() => setShowAddMilestone(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Milestone
                </Button>
              </CardTitle>
              <CardDescription>
                Each milestone compounds your momentum
              </CardDescription>
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
                        <Label>Target Value (optional)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 1000"
                          value={newMilestoneTarget}
                          onChange={(e) => setNewMilestoneTarget(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Momentum Impact</Label>
                        <Input
                          type="number"
                          value={newMilestoneImpact}
                          onChange={(e) => setNewMilestoneImpact(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addMilestone} className="flex-1">
                        Add Milestone
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddMilestone(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Set your first milestone to start tracking your progress!
                  </p>
                </div>
              ) : (
                milestones.map((milestone) => (
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
                            <div 
                              className="w-5 h-5 rounded-full border-2 border-muted cursor-pointer hover:border-primary"
                              onClick={() => completeMilestone(milestone.id)}
                            />
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
                            Achieved {new Date(milestone.date_achieved).toLocaleDateString()}
                          </p>
                        ) : milestone.current_value !== null && milestone.target_value ? (
                          <div className="ml-7 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {(milestone.current_value || 0).toLocaleString()} / {milestone.target_value.toLocaleString()}
                              </span>
                              <span className="font-semibold">
                                {Math.round(((milestone.current_value || 0) / milestone.target_value) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={((milestone.current_value || 0) / milestone.target_value) * 100} 
                              className="h-2" 
                            />
                          </div>
                        ) : !milestone.achieved && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="ml-7 mt-2"
                            onClick={() => completeMilestone(milestone.id)}
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
                    <Button 
                      size="sm"
                      onClick={() => performAction(item.action, parseInt(item.impact))}
                    >
                      Do It
                    </Button>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Momentum Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  What's Working
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {(momentumScore?.release_velocity || 0) > 40 && (
                    <li>• Great release velocity - keep the music coming!</li>
                  )}
                  {(momentumScore?.engagement_rate || 0) > 30 && (
                    <li>• Strong engagement - your fans are connecting</li>
                  )}
                  {(momentumScore?.streak_days || 0) > 7 && (
                    <li>• Impressive activity streak - consistency pays off</li>
                  )}
                  {(momentumScore?.score || 0) === 0 && (
                    <li>• Upload your first track to start building momentum!</li>
                  )}
                </ul>
              </Card>

              <Card className="p-4 bg-red-500/10 border-red-500/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Momentum Risks
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {(momentumScore?.release_velocity || 0) < 20 && (
                    <li>• Low release velocity - consider dropping new music</li>
                  )}
                  {(momentumScore?.content_consistency || 0) < 30 && (
                    <li>• Content calendar is empty - schedule some posts</li>
                  )}
                  {(momentumScore?.fan_growth || 0) < 10 && (
                    <li>• Fan base needs growth - promote your profile</li>
                  )}
                </ul>
              </Card>

              <Card className="p-4 bg-primary/10 border-primary/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Momentum Truth
                </h4>
                <p className="text-sm text-muted-foreground italic">
                  "The industry doesn't reward talent alone. It rewards momentum. 
                  The artists who stay visible, stay consistent, and keep shipping work 
                  are the ones who break through. Your momentum score isn't just a number - 
                  it's a prediction of your future success."
                </p>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};