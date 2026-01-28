import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, MapPin, Smartphone, Monitor, Tablet,
  Users, TrendingUp, PieChart, Clock, User, Languages, Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";

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

  useEffect(() => {
    loadDemographics();
  }, []);

  const loadDemographics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all demographics for this artist
      const { data, error } = await supabase
        .from("listener_demographics")
        .select("*")
        .eq("artist_id", user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setDemographics({
          countries: [],
          cities: [],
          devices: [],
          browsers: [],
          operatingSystems: [],
          genders: [],
          ageRanges: [],
          listeningTimes: [],
          languages: [],
          referralSources: [],
          totalListeners: 0,
          uniqueListeners: 0
        });
        return;
      }

      // Helper function to process category data
      const processCategory = (key: string, data: any[]) => {
        const map: Record<string, number> = {};
        data.forEach((d: any) => {
          const value = d[key];
          if (value) {
            map[value] = (map[value] || 0) + 1;
          }
        });
        return Object.entries(map)
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / data.length) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      };

      // Process all categories
      const countries = processCategory('country', data);
      const cities = processCategory('city', data);
      const devices = processCategory('device_type', data).map(d => ({
        ...d,
        name: d.name.charAt(0).toUpperCase() + d.name.slice(1)
      }));
      const browsers = processCategory('browser', data);
      const operatingSystems = processCategory('os', data);
      const genders = processCategory('gender', data);
      const ageRanges = processCategory('age_range', data);
      const listeningTimes = processCategory('listening_time_of_day', data);
      const languages = processCategory('language', data);
      const referralSources = processCategory('referral_source', data);

      // Count unique listeners
      const uniqueListenerIds = new Set(data.map((d: any) => d.listener_id).filter(Boolean));

      setDemographics({
        countries,
        cities,
        devices,
        browsers,
        operatingSystems,
        genders,
        ageRanges,
        listeningTimes,
        languages,
        referralSources,
        totalListeners: data.length,
        uniqueListeners: uniqueListenerIds.size
      });
    } catch (error) {
      console.error("Error loading demographics:", error);
      toast.error("Failed to load demographics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading fan demographics...</p>
      </Card>
    );
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'non-binary': return 'Non-Binary';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Advanced Fan Demographics</h2>
          <p className="text-sm text-muted-foreground">
            Deep audience insights - location, behavior, and listening habits
          </p>
        </div>
      </div>

      {demographics && demographics.totalListeners === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Demographics Yet</h3>
          <p className="text-sm text-muted-foreground">
            Demographics data will appear here as fans listen to your music.
            Share your tracks to start collecting insights!
          </p>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Listens</span>
                </div>
                <p className="text-2xl font-bold">{demographics?.totalListeners.toLocaleString() || 0}</p>
              </Card>
              <Card className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Unique Fans</span>
                </div>
                <p className="text-2xl font-bold">{demographics?.uniqueListeners.toLocaleString() || 0}</p>
              </Card>
              <Card className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Countries</span>
                </div>
                <p className="text-2xl font-bold">{demographics?.countries.length || 0}</p>
              </Card>
              <Card className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Mobile %</span>
                </div>
                <p className="text-2xl font-bold">
                  {demographics?.devices.find(d => d.name.toLowerCase() === 'mobile')?.percentage || 0}%
                </p>
              </Card>
            </div>

            {/* Gender & Age Distribution */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Gender Distribution
                  </CardTitle>
                  <CardDescription>Who's listening to your music</CardDescription>
                </CardHeader>
                <CardContent>
                  {demographics?.genders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Gender data will appear as more fans listen</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <div className="w-36 h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={demographics?.genders || []}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={60}
                            >
                              {demographics?.genders.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                              ))}
                            </Pie>
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {demographics?.genders.map((gender, idx) => (
                          <div key={gender.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: GENDER_COLORS[idx % GENDER_COLORS.length] }}
                                />
                                {getGenderLabel(gender.name)}
                              </span>
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

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Age Distribution
                  </CardTitle>
                  <CardDescription>Age breakdown of your audience</CardDescription>
                </CardHeader>
                <CardContent>
                  {demographics?.ageRanges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Age data will appear as more fans listen</p>
                    </div>
                  ) : (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographics?.ageRanges || []}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))' 
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Device Breakdown */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    Device Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demographics?.devices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No device data yet</p>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={demographics?.devices || []}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={50}
                            >
                              {demographics?.devices.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {demographics?.devices.map((device, idx) => (
                          <div key={device.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            {getDeviceIcon(device.name)}
                            <span className="text-sm flex-1">{device.name}</span>
                            <Badge variant="outline">{device.percentage}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Operating Systems */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-primary" />
                    Operating Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demographics?.operatingSystems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No OS data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.operatingSystems.slice(0, 5).map((os, idx) => (
                        <div key={os.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-primary">{idx + 1}</span>
                              {os.name}
                            </span>
                            <Badge variant="secondary">{os.percentage}%</Badge>
                          </div>
                          <Progress value={os.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Browser Stats */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Browser Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demographics?.browsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No browser data yet</p>
                  ) : (
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographics?.browsers || []}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <YAxis hide />
                          <Tooltip />
                          <Bar 
                            dataKey="count" 
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Languages */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-primary" />
                    Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demographics?.languages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No language data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.languages.slice(0, 5).map((lang, idx) => (
                        <div key={lang.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{lang.name}</span>
                            <Badge variant="secondary">{lang.count} listens</Badge>
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

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Countries */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Top Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demographics?.countries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No country data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.countries.slice(0, 6).map((country, idx) => (
                        <div key={country.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-primary">{idx + 1}</span>
                              {country.name}
                            </span>
                            <Badge variant="secondary">{country.percentage}%</Badge>
                          </div>
                          <Progress value={country.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Cities */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Top Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {demographics?.cities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No city data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.cities.slice(0, 6).map((city, idx) => (
                        <div key={city.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-primary">{idx + 1}</span>
                              {city.name}
                            </span>
                            <Badge variant="secondary">{city.count} listens</Badge>
                          </div>
                          <Progress value={city.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tour Insight */}
            <Card className="glass-card p-4 bg-primary/10 border-primary/30">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2">Tour Planning Insight</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your listener demographics, your top markets for live shows are:{" "}
                    <span className="text-foreground font-medium">
                      {demographics?.cities.slice(0, 3).map(c => c.name).join(", ") || "Building data..."}
                    </span>
                    . Consider these cities for your next tour!
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Listening Times */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Peak Listening Times
                  </CardTitle>
                  <CardDescription>When your fans are most active</CardDescription>
                </CardHeader>
                <CardContent>
                  {demographics?.listeningTimes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Listening time data coming soon</p>
                    </div>
                  ) : (
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographics?.listeningTimes || []}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <YAxis hide />
                          <Tooltip />
                          <Bar 
                            dataKey="count" 
                            fill="hsl(var(--secondary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referral Sources */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Discovery Sources
                  </CardTitle>
                  <CardDescription>How fans find your music</CardDescription>
                </CardHeader>
                <CardContent>
                  {demographics?.referralSources.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Share2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Referral source tracking coming soon</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {demographics?.referralSources.map((source, idx) => (
                        <div key={source.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              />
                              {source.name}
                            </span>
                            <Badge variant="secondary">{source.percentage}%</Badge>
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
        </Tabs>
      )}
    </div>
  );
};