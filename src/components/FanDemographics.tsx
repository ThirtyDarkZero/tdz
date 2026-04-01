import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, MapPin, Smartphone, Monitor, Tablet,
  Users, TrendingUp, PieChart, Clock, User, Languages, Share2, Sparkles, Loader2,
  Save, Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { useArtistNarrativeContext, serializeNarrativeContext } from "@/hooks/useArtistNarrativeContext";

interface DemographicData {
  countries: { name: string; count: number; percentage: number }[];
  cities: { name: string; count: number; percentage: number }[];
  devices: { name: string; count: number; percentage: number }[];
  browsers: { name: string; count: number; percentage: number }[];
  operatingSystems: { name: string; count: number; percentage: number }[];
  genders: { name: string; count: number; percentage: number }[];
  ageRanges: { name: string; count: number; percentage: number }[];
  listeningTimes: { name: string; count: number; percentage: number }[];
  languages: { name: string; count: number; percentage: number }[];
  referralSources: { name: string; count: number; percentage: number }[];
  totalListeners: number;
  uniqueListeners: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
const GENDER_COLORS = ['#3B82F6', '#EC4899', '#8B5CF6', '#6B7280'];

export const FanDemographics = () => {
  const [demographics, setDemographics] = useState<DemographicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingStrategy, setSavingStrategy] = useState(false);
  const ctx = useArtistNarrativeContext();

  useEffect(() => { loadDemographics(); }, []);

  const loadDemographics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("listener_demographics")
        .select("listener_id,country,city,device_type,browser,os,gender,age_range,listening_time_of_day,language,referral_source")
        .eq("artist_id", user.id);
      if (error) throw error;
      if (!data || data.length === 0) {
        setDemographics({ countries: [], cities: [], devices: [], browsers: [], operatingSystems: [], genders: [], ageRanges: [], listeningTimes: [], languages: [], referralSources: [], totalListeners: 0, uniqueListeners: 0 });
        return;
      }
      const processCategory = (key: string, data: any[]) => {
        const map: Record<string, number> = {};
        data.forEach((d: any) => { const value = d[key]; if (value) map[value] = (map[value] || 0) + 1; });
        return Object.entries(map).map(([name, count]) => ({ name, count, percentage: Math.round((count / data.length) * 100) })).sort((a, b) => b.count - a.count).slice(0, 10);
      };
      setDemographics({
        countries: processCategory('country', data),
        cities: processCategory('city', data),
        devices: processCategory('device_type', data).map(d => ({ ...d, name: d.name.charAt(0).toUpperCase() + d.name.slice(1) })),
        browsers: processCategory('browser', data),
        operatingSystems: processCategory('os', data),
        genders: processCategory('gender', data),
        ageRanges: processCategory('age_range', data),
        listeningTimes: processCategory('listening_time_of_day', data),
        languages: processCategory('language', data),
        referralSources: processCategory('referral_source', data),
        totalListeners: data.length,
        uniqueListeners: new Set(data.map((d: any) => d.listener_id).filter(Boolean)).size,
      });
    } catch (error) {
      console.error("Error loading demographics:", error);
      toast.error("Failed to load demographics");
    } finally { setLoading(false); }
  };

  const saveStrategy = async (content: string) => {
    setSavingStrategy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from("saved_strategies").insert({
        user_id: user.id, strategy_type: "Demographics Analysis",
        title: `Audience Analysis - ${new Date().toLocaleDateString()}`,
        content, metadata: { total_listeners: demographics?.totalListeners }
      });
      if (error) throw error;
      toast.success("Analysis saved!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingStrategy(false); }
  };

  const exportStrategy = (content: string) => {
    const blob = new Blob([`# Audience Demographics Report\nGenerated: ${new Date().toLocaleString()}\nTotal Listeners: ${demographics?.totalListeners || 0}\n\n---\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `audience-analysis-${new Date().toISOString().split("T")[0]}.md`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Analysis exported!");
  };

  const generateAIInsight = async () => {
    setAiLoading(true); setAiInsight(null);
    try {
      const serialized = serializeNarrativeContext(ctx);
      const demoSummary = demographics ? `
DEMOGRAPHIC DATA:
- Total Listens: ${demographics.totalListeners}, Unique Fans: ${demographics.uniqueListeners}
- Top Countries: ${demographics.countries.slice(0, 5).map(c => `${c.name} (${c.percentage}%)`).join(", ") || "No data"}
- Top Cities: ${demographics.cities.slice(0, 5).map(c => `${c.name} (${c.count})`).join(", ") || "No data"}
- Gender: ${demographics.genders.map(g => `${g.name} ${g.percentage}%`).join(", ") || "No data"}
- Age: ${demographics.ageRanges.map(a => `${a.name}: ${a.percentage}%`).join(", ") || "No data"}
- Peak Times: ${demographics.listeningTimes.slice(0, 3).map(t => t.name).join(", ") || "No data"}
- Sources: ${demographics.referralSources.slice(0, 3).map(r => `${r.name} (${r.percentage}%)`).join(", ") || "No data"}
- Devices: ${demographics.devices.map(d => `${d.name} ${d.percentage}%`).join(", ") || "No data"}
` : "No demographic data available yet.";
      const { data, error } = await supabase.functions.invoke("campaign-brain", {
        body: {
          action: "generate-content", narrative_context: serialized,
          content_type: "caption", release_phase: ctx.releaseCycle.phase,
          extra_context: `Analyze fan demographics:\n${demoSummary}\n\nProvide 4-5 paragraphs: audience profile, geographic strategy, content timing, growth opportunities, tour recommendations.`,
        },
      });
      if (error) throw error;
      setAiInsight(typeof data?.result === "string" ? data.result : JSON.stringify(data?.result));
    } catch (err: any) { toast.error(err.message || "Failed to generate insight"); }
    finally { setAiLoading(false); }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center bg-card/50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ fontFamily: "'Raleway', sans-serif" }} className="text-muted-foreground">Loading fan demographics...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6" style={{ color: "#00CFFF" }} />
        <div>
          <h2 style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", fontSize: "1.75rem" }}>
            Advanced Fan Demographics
          </h2>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: "0.8rem" }} className="text-muted-foreground">
            AI-powered audience insights — location, behavior, and listening habits
          </p>
        </div>
        <Badge variant="outline" className="ml-auto gap-1 text-xs border-primary/30 text-primary">
          <Sparkles className="w-3 h-3" /> AI Powered
        </Badge>
      </div>

      {demographics && demographics.totalListeners === 0 ? (
        <Card className="p-12 text-center bg-card/50">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>No Demographics Yet</h3>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>Demographics will appear as fans listen.</p>
        </Card>
      ) : (
        <Tabs defaultValue="ai-insights" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="ai-insights" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Insights</TabsTrigger>
            <TabsTrigger value="overview" style={{ fontFamily: "'Raleway', sans-serif" }}>Overview</TabsTrigger>
            <TabsTrigger value="audience" style={{ fontFamily: "'Raleway', sans-serif" }}>Audience</TabsTrigger>
            <TabsTrigger value="location" style={{ fontFamily: "'Raleway', sans-serif" }}>Location</TabsTrigger>
            <TabsTrigger value="behavior" style={{ fontFamily: "'Raleway', sans-serif" }}>Behavior</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-insights" className="space-y-6">
            <Card className="bg-card/50 border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}>
                  <Sparkles className="w-5 h-5 text-primary" /> AI Audience Intelligence
                </CardTitle>
                <CardDescription style={{ fontFamily: "'Raleway', sans-serif" }}>
                  Deep analysis of who your fans are, where they are, and how to reach more of them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Listens", value: demographics?.totalListeners.toLocaleString() || "0" },
                    { label: "Unique Fans", value: demographics?.uniqueListeners.toLocaleString() || "0" },
                    { label: "Countries", value: String(demographics?.countries.length || 0) },
                    { label: "Cities", value: String(demographics?.cities.length || 0) },
                  ].map(s => (
                    <Card key={s.label} className="p-3 bg-primary/5 border-primary/20">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>{s.label}</p>
                    </Card>
                  ))}
                </div>

                <Button onClick={generateAIInsight} disabled={aiLoading} className="w-full gap-2">
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? "Analyzing your audience..." : "Generate AI Audience Analysis"}
                </Button>
                {aiLoading && <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{ width: `${100 - i * 10}%` }} />)}</div>}
                {aiInsight && (
                  <Card className="p-5 bg-card/80 border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-primary" style={{ fontFamily: "'Raleway', sans-serif" }}>AI Audience Report</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => saveStrategy(aiInsight)} disabled={savingStrategy}><Save className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => exportStrategy(aiInsight)}><Download className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90" style={{ fontFamily: "'Raleway', sans-serif" }}>{aiInsight}</div>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Total Listens", value: demographics?.totalListeners.toLocaleString() || "0", color: "text-primary" },
                { icon: User, label: "Unique Fans", value: demographics?.uniqueListeners.toLocaleString() || "0", color: "text-blue-500" },
                { icon: Globe, label: "Countries", value: String(demographics?.countries.length || 0), color: "text-green-500" },
                { icon: Smartphone, label: "Mobile %", value: `${demographics?.devices.find(d => d.name.toLowerCase() === 'mobile')?.percentage || 0}%`, color: "text-purple-500" },
              ].map(s => (
                <Card key={s.label} className="p-4 bg-card/50">
                  <div className="flex items-center gap-2 mb-2"><s.icon className={`w-4 h-4 ${s.color}`} /><span className="text-sm text-muted-foreground" style={{ fontFamily: "'Raleway', sans-serif" }}>{s.label}</span></div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><User className="w-5 h-5 text-primary" /> Gender Distribution</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.genders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>Gender data will appear as more fans listen</p>
                  ) : (
                    <div className="flex items-center gap-6">
                      <div className="w-36 h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie><Pie data={demographics?.genders || []} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={60}>{demographics?.genders.map((_, index) => <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />)}</Pie></RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {demographics?.genders.map((gender, idx) => (
                          <div key={gender.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS[idx % GENDER_COLORS.length] }} /><span style={{ fontFamily: "'Raleway', sans-serif" }}>{gender.name}</span></span>
                              <Badge variant="secondary">{gender.percentage}%</Badge>
                            </div>
                            <Progress value={gender.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><Users className="w-5 h-5 text-primary" /> Age Distribution</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.ageRanges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>Age data will appear as more fans listen</p>
                  ) : (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographics?.ageRanges || []}>
                          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><Smartphone className="w-5 h-5 text-primary" /> Devices</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.devices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>Device data coming soon</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.devices.map((device, idx) => (
                        <div key={device.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">{getDeviceIcon(device.name)}<span style={{ fontFamily: "'Raleway', sans-serif" }}>{device.name}</span></span>
                            <Badge variant="outline">{device.percentage}%</Badge>
                          </div>
                          <Progress value={device.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><Share2 className="w-5 h-5 text-primary" /> Discovery Sources</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.referralSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>Source data coming soon</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.referralSources.map((source) => (
                        <div key={source.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ fontFamily: "'Raleway', sans-serif" }}>{source.name}</span>
                            <Badge variant="outline">{source.percentage}%</Badge>
                          </div>
                          <Progress value={source.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><Globe className="w-5 h-5 text-primary" /> Top Countries</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.countries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>Country data coming soon</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.countries.map((country, idx) => (
                        <div key={country.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} /><span style={{ fontFamily: "'Raleway', sans-serif" }}>{country.name}</span></span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{country.count} listens</span>
                              <Badge variant="outline">{country.percentage}%</Badge>
                            </div>
                          </div>
                          <Progress value={country.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><MapPin className="w-5 h-5 text-primary" /> Top Cities</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.cities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>City data coming soon</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.cities.map((city, idx) => (
                        <div key={city.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-primary" /><span style={{ fontFamily: "'Raleway', sans-serif" }}>{city.name}</span></span>
                            <Badge variant="outline">{city.count} listens</Badge>
                          </div>
                          <Progress value={city.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><Clock className="w-5 h-5 text-primary" /> Peak Listening Times</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.listeningTimes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>Timing data coming soon</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.listeningTimes.map((time) => (
                        <div key={time.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-primary" /><span style={{ fontFamily: "'Raleway', sans-serif" }}>{time.name}</span></span>
                            <Badge variant="outline">{time.percentage}%</Badge>
                          </div>
                          <Progress value={time.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em" }}><Languages className="w-5 h-5 text-primary" /> Languages</CardTitle></CardHeader>
                <CardContent>
                  {demographics?.languages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" style={{ fontFamily: "'Raleway', sans-serif" }}>Language data coming soon</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.languages.map((lang) => (
                        <div key={lang.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ fontFamily: "'Raleway', sans-serif" }}>{lang.name}</span>
                            <Badge variant="outline">{lang.percentage}%</Badge>
                          </div>
                          <Progress value={lang.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
