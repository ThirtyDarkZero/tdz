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
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Pillar 4: Momentum Continuity
export const MomentumTracker = () => {
  const [momentumScore, setMomentumScore] = useState(78);
  const [streak, setStreak] = useState(23);

  const momentumData = [
    { week: 'W1', score: 45 },
    { week: 'W2', score: 52 },
    { week: 'W3', score: 61 },
    { week: 'W4', score: 58 },
    { week: 'W5', score: 67 },
    { week: 'W6', score: 73 },
    { week: 'W7', score: 78 }
  ];

  const milestones = [
    { title: "First 1K Streams", achieved: true, date: "Jan 15, 2025", impact: "+12" },
    { title: "10 Releases", achieved: true, date: "Feb 3, 2025", impact: "+8" },
    { title: "First Playlist Feature", achieved: true, date: "Feb 20, 2025", impact: "+15" },
    { title: "5K Email List", achieved: false, current: 3247, target: 5000, impact: "+20" },
    { title: "100K Total Streams", achieved: false, current: 67234, target: 100000, impact: "+25" }
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
                {momentumScore}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +12 this week
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
              <Progress value={momentumScore} className="h-3" />
            </div>
            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 px-3 py-1">
              <Flame className="w-3 h-3 mr-1" />
              {streak} day streak
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
                  <span className="text-sm">Tracks released (30d)</span>
                  <Badge className="bg-green-500/20 text-green-500">3</Badge>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Target: 1 release every 10 days
                </p>
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <TrendingUp className="w-4 h-4" />
                  On pace (+18 momentum)
                </div>
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
                  <span className="text-sm">Avg engagement</span>
                  <Badge className="bg-blue-500/20 text-blue-500">6.2%</Badge>
                </div>
                <Progress value={82} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Target: 5%+ engagement rate
                </p>
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <TrendingUp className="w-4 h-4" />
                  Above target (+15 momentum)
                </div>
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
                  <span className="text-sm">Posts this week</span>
                  <Badge className="bg-yellow-500/20 text-yellow-500">4/7</Badge>
                </div>
                <Progress value={57} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Target: Daily content
                </p>
                <div className="flex items-center gap-2 text-sm text-yellow-500">
                  <AlertCircle className="w-4 h-4" />
                  Below pace (-5 momentum)
                </div>
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
                  <span className="text-sm">New fans (7d)</span>
                  <Badge className="bg-green-500/20 text-green-500">+184</Badge>
                </div>
                <Progress value={92} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Target: 100+ per week
                </p>
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <TrendingUp className="w-4 h-4" />
                  Accelerating (+22 momentum)
                </div>
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
              {milestones.map((milestone, idx) => (
                <Card 
                  key={idx} 
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
                          {milestone.impact} momentum
                        </Badge>
                      </div>
                      {milestone.achieved ? (
                        <p className="text-xs text-muted-foreground ml-7">
                          Achieved {milestone.date}
                        </p>
                      ) : (
                        <div className="ml-7 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {milestone.current?.toLocaleString()} / {milestone.target?.toLocaleString()}
                            </span>
                            <span className="font-semibold">
                              {milestone.current && milestone.target 
                                ? Math.round((milestone.current / milestone.target) * 100) 
                                : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={
                              milestone.current && milestone.target 
                                ? (milestone.current / milestone.target) * 100 
                                : 0
                            } 
                            className="h-2" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
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
                  description: "Maintain 10-day release cadence"
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
              <p>• Your release cadence is strong - maintain this pace</p>
              <p>• Fan engagement is 2.4x industry average - keep authentic</p>
              <p>• Email list growth accelerating (+42% vs last month)</p>
              <p>• Super fans (top 10%) driving 67% of all engagement</p>
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
              <p>• Content posting dropped 40% this week - consistency matters</p>
              <p>• 17 days since last release - momentum window closing</p>
              <p>• Engagement on Instagram down 12% - refresh your approach</p>
              <p>• Only 1 collaboration this quarter - expand network</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Next 30 Days Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">Week 1-2: Maintain</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Release single on schedule (Day 3)</li>
                  <li>• Daily stories showing process</li>
                  <li>• Email blast to list (Day 5)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Week 3-4: Accelerate</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Launch collaboration (Day 17)</li>
                  <li>• Pre-save campaign for next release</li>
                  <li>• Go live 2x per week</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-sm font-semibold text-primary">
                  Projected momentum: {momentumScore} → 92 (+14)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};