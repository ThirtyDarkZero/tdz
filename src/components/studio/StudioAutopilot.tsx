import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot, Zap, Radio, BarChart3, Users, DollarSign, Music2, Send,
  Shield, Clock, CheckCircle2, AlertCircle, RefreshCw, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface AutopilotConfig {
  id: string;
  is_enabled: boolean;
  auto_publish_releases: boolean;
  auto_analytics_reports: boolean;
  auto_fan_engagement: boolean;
  auto_revenue_optimization: boolean;
  auto_social_posting: boolean;
  auto_playlist_pitching: boolean;
  auto_momentum_tracking: boolean;
  last_run_at: string | null;
  run_count: number;
}

interface AutopilotLog {
  id: string;
  task_type: string;
  status: string;
  summary: string;
  metadata: any;
  created_at: string;
}

const AGENTS = [
  { key: 'auto_publish_releases', label: 'Release Autopilot', desc: 'Auto-publishes albums & tracks on their scheduled date', icon: Radio, color: '#10B981' },
  { key: 'auto_analytics_reports', label: 'Analytics Agent', desc: 'Generates weekly performance snapshots automatically', icon: BarChart3, color: '#3B82F6' },
  { key: 'auto_fan_engagement', label: 'Fan Intelligence', desc: 'Refreshes fan metrics, monthly listeners, and super-fan counts', icon: Users, color: '#EC4899' },
  { key: 'auto_revenue_optimization', label: 'Revenue Optimizer', desc: 'Tracks revenue trends and flags anomalies', icon: DollarSign, color: '#F59E0B' },
  { key: 'auto_playlist_pitching', label: 'Playlist Scout', desc: 'Identifies top tracks for playlist submission', icon: Music2, color: '#8B5CF6' },
  { key: 'auto_momentum_tracking', label: 'Momentum Engine', desc: 'Calculates real-time momentum scores from streams & followers', icon: Zap, color: '#06B6D4' },
  { key: 'auto_social_posting', label: 'Social Autopilot', desc: 'Drafts & schedules social content from your calendar', icon: Send, color: '#EF4444' },
] as const;

const TASK_ICONS: Record<string, any> = {
  auto_publish: Radio,
  analytics_report: BarChart3,
  fan_engagement: Users,
  revenue_optimization: DollarSign,
  playlist_pitching: Music2,
  momentum_update: Zap,
  social_posting: Send,
};

const GlassCard = ({ children, className = "", gradient = "" }: { children: React.ReactNode; className?: string; gradient?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-border/20 ${className}`}
    style={{
      background: gradient || "rgba(255,255,255,0.03)",
      backdropFilter: "blur(40px) saturate(200%)",
      WebkitBackdropFilter: "blur(40px) saturate(200%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
    }}>
    {children}
  </div>
);

export const StudioAutopilot = () => {
  const { user } = useAuthContext();
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [logs, setLogs] = useState<AutopilotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadConfig();
  }, [user]);

  // Realtime log updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('autopilot-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'autopilot_logs' }, (payload) => {
        setLogs(prev => [payload.new as AutopilotLog, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadConfig = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get or create config
      let { data, error } = await supabase
        .from('artist_autopilot')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        const { data: newConfig } = await supabase
          .from('artist_autopilot')
          .insert({ user_id: user.id })
          .select()
          .single();
        data = newConfig;
      }

      if (data) setConfig(data as any);

      // Load recent logs
      const { data: logData } = await supabase
        .from('autopilot_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      setLogs((logData || []) as AutopilotLog[]);
    } catch (err) {
      console.error("Autopilot load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: boolean) => {
    if (!config || !user) return;
    setSaving(true);
    try {
      const updates = { [key]: value, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from('artist_autopilot')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
      setConfig(prev => prev ? { ...prev, [key]: value } : prev);
      toast.success(value ? "Agent activated" : "Agent paused");
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const toggleMaster = async () => {
    if (!config) return;
    const newVal = !config.is_enabled;
    await updateConfig('is_enabled', newVal);
    if (newVal) {
      toast.success("🤖 Autopilot engaged — agents will run even when you're offline");
    } else {
      toast("Autopilot paused — agents are standing by");
    }
  };

  const runNow = async () => {
    toast.info("Running autopilot cycle...");
    try {
      const { data, error } = await supabase.functions.invoke('studio-autopilot');
      if (error) throw error;
      toast.success(`Autopilot completed: ${data?.processed || 0} artist(s) processed`);
      loadConfig();
    } catch {
      toast.error("Autopilot run failed — will retry on next scheduled cycle");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const enabledCount = config ? AGENTS.filter(a => (config as any)[a.key]).length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Six Caps', sans-serif", letterSpacing: "0.04em", fontSize: "2rem" }}>Autopilot</h1>
        <p style={{ fontFamily: "'Raleway', sans-serif" }} className="text-muted-foreground">AI agents that work while you sleep</p>
      </div>

      {/* Master Toggle */}
      <GlassCard className="p-6" gradient={config?.is_enabled
        ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.06), rgba(0,0,0,0))"
        : "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0))"
      }>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative" style={{
              background: config?.is_enabled
                ? "linear-gradient(135deg, #10B981, #06B6D4)"
                : "rgba(255,255,255,0.06)",
              boxShadow: config?.is_enabled ? "0 8px 32px rgba(16,185,129,0.3)" : "none",
            }}>
              <Bot className="w-7 h-7 text-white" />
              {config?.is_enabled && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 animate-pulse border-2 border-background" />}
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Studio Autopilot
                {config?.is_enabled && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">ACTIVE</Badge>}
              </h2>
              <p className="text-sm text-muted-foreground">
                {config?.is_enabled
                  ? `${enabledCount} agent${enabledCount !== 1 ? 's' : ''} running • ${config.run_count} cycles completed`
                  : "Enable to let AI agents manage your studio 24/7"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {config?.is_enabled && (
              <Button variant="outline" size="sm" onClick={runNow} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Run Now
              </Button>
            )}
            <Switch
              checked={config?.is_enabled || false}
              onCheckedChange={toggleMaster}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
        {config?.last_run_at && (
          <div className="mt-3 pt-3 border-t border-border/10 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Last run: {format(new Date(config.last_run_at), "MMM d, yyyy 'at' h:mm a")}
          </div>
        )}
      </GlassCard>

      {/* Agent Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map(agent => {
          const isActive = config ? (config as any)[agent.key] : false;
          const Icon = agent.icon;
          return (
            <GlassCard key={agent.key} className="p-4" gradient={isActive && config?.is_enabled
              ? `linear-gradient(135deg, ${agent.color}10, transparent)`
              : undefined
            }>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                    background: isActive ? `${agent.color}20` : "rgba(255,255,255,0.05)",
                  }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: isActive ? agent.color : 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{agent.label}</p>
                    {isActive && config?.is_enabled && (
                      <span className="text-[9px] text-green-400 flex items-center gap-0.5">
                        <Activity className="w-2.5 h-2.5 animate-pulse" /> Active
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(v) => updateConfig(agent.key, v)}
                  disabled={saving}
                  className="data-[state=checked]:bg-green-500 scale-90"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* Activity Log */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Agent Activity Log
            {logs.length > 0 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">{logs.length} entries</Badge>
            )}
          </h3>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1 opacity-60">Enable autopilot and agents will start logging their work</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {logs.map(log => {
              const Icon = TASK_ICONS[log.task_type] || CheckCircle2;
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{
                    background: log.status === 'completed' ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: log.status === 'completed' ? '#10B981' : '#EF4444' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{log.summary}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(log.created_at), "MMM d, h:mm a")} • {log.task_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[8px] h-4 px-1 shrink-0 ${
                    log.status === 'completed' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
                  }`}>
                    {log.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
