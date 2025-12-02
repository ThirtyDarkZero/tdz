import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, MapPin, Smartphone, Monitor, Tablet,
  Users, TrendingUp, PieChart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from "recharts";

interface DemographicData {
  countries: { name: string; count: number; percentage: number }[];
  cities: { name: string; count: number; percentage: number }[];
  devices: { name: string; count: number; percentage: number }[];
  browsers: { name: string; count: number; percentage: number }[];
  totalListeners: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

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
          totalListeners: 0
        });
        return;
      }

      // Process countries
      const countryMap: Record<string, number> = {};
      data.forEach((d: any) => {
        if (d.country) {
          countryMap[d.country] = (countryMap[d.country] || 0) + 1;
        }
      });
      const countries = Object.entries(countryMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / data.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Process cities
      const cityMap: Record<string, number> = {};
      data.forEach((d: any) => {
        if (d.city) {
          cityMap[d.city] = (cityMap[d.city] || 0) + 1;
        }
      });
      const cities = Object.entries(cityMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / data.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Process devices
      const deviceMap: Record<string, number> = {};
      data.forEach((d: any) => {
        if (d.device_type) {
          deviceMap[d.device_type] = (deviceMap[d.device_type] || 0) + 1;
        }
      });
      const devices = Object.entries(deviceMap)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
          percentage: Math.round((count / data.length) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      // Process browsers
      const browserMap: Record<string, number> = {};
      data.forEach((d: any) => {
        if (d.browser) {
          browserMap[d.browser] = (browserMap[d.browser] || 0) + 1;
        }
      });
      const browsers = Object.entries(browserMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / data.length) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      setDemographics({
        countries,
        cities,
        devices,
        browsers,
        totalListeners: data.length
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Fan Demographics</h2>
          <p className="text-sm text-muted-foreground">
            Know your audience - location, devices, and listening habits
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
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Listens</span>
              </div>
              <p className="text-2xl font-bold">{demographics?.totalListeners || 0}</p>
            </Card>
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Countries</span>
              </div>
              <p className="text-2xl font-bold">{demographics?.countries.length || 0}</p>
            </Card>
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Cities</span>
              </div>
              <p className="text-2xl font-bold">{demographics?.cities.length || 0}</p>
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No country data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {demographics?.countries.slice(0, 5).map((country, idx) => (
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No city data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {demographics?.cities.slice(0, 5).map((city, idx) => (
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No device data yet
                  </p>
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

            {/* Browser Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  Browser Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {demographics?.browsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No browser data yet
                  </p>
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
        </>
      )}
    </div>
  );
};