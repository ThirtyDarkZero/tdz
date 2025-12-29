import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Database,
  HardDrive,
  Bot,
  CreditCard,
  Video,
  Activity,
  Clock,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosticResult {
  name: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface SystemDiagnostics {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  services: DiagnosticResult[];
  summary: {
    healthy: number;
    degraded: number;
    errors: number;
    total: number;
  };
}

const statusIcons: Record<string, React.ReactNode> = {
  healthy: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  degraded: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  unknown: <HelpCircle className="w-5 h-5 text-muted-foreground" />,
};

const serviceIcons: Record<string, React.ReactNode> = {
  'Database': <Database className="w-5 h-5" />,
  'Storage': <HardDrive className="w-5 h-5" />,
  'AI Gateway': <Bot className="w-5 h-5" />,
  'OpenAI API': <Bot className="w-5 h-5" />,
  'Square Payments': <CreditCard className="w-5 h-5" />,
};

export function SystemDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-diagnostics');

      if (error) throw error;

      setDiagnostics(data);
      setLastRefresh(new Date());
      
      if (data.overallStatus === 'critical') {
        toast.error('System health is critical!');
      } else if (data.overallStatus === 'degraded') {
        toast.warning('Some services are degraded');
      }
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error('Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(runDiagnostics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getOverallStatusColor = () => {
    if (!diagnostics) return 'border-muted';
    switch (diagnostics.overallStatus) {
      case 'healthy': return 'border-green-500/50 bg-green-500/5';
      case 'degraded': return 'border-yellow-500/50 bg-yellow-500/5';
      case 'critical': return 'border-red-500/50 bg-red-500/5';
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.startsWith('Video:')) return <Video className="w-5 h-5" />;
    return serviceIcons[name] || <Activity className="w-5 h-5" />;
  };

  return (
    <Card className={`glass-card p-6 ${getOverallStatusColor()}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">System Diagnostics</h3>
            <p className="text-xs text-muted-foreground">
              {lastRefresh && `Last check: ${lastRefresh.toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {diagnostics && (
            <Badge
              variant="outline"
              className={
                diagnostics.overallStatus === 'healthy'
                  ? 'border-green-500/50 text-green-500 bg-green-500/10'
                  : diagnostics.overallStatus === 'degraded'
                  ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10'
                  : 'border-red-500/50 text-red-500 bg-red-500/10'
              }
            >
              {diagnostics.overallStatus.toUpperCase()}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {diagnostics && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-2xl font-bold text-green-500">{diagnostics.summary.healthy}</p>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-2xl font-bold text-yellow-500">{diagnostics.summary.degraded}</p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-2xl font-bold text-red-500">{diagnostics.summary.errors}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-2xl font-bold text-primary">{diagnostics.summary.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      )}

      {/* Service List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {loading && !diagnostics ? (
            <div className="flex items-center justify-center h-32 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Running diagnostics...</span>
            </div>
          ) : diagnostics?.services.map((service, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                service.status === 'healthy'
                  ? 'bg-card/50 border-border/50 hover:border-green-500/30'
                  : service.status === 'degraded'
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : service.status === 'error'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-muted/20 border-muted/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {getServiceIcon(service.name)}
                </div>
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {service.responseTime !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{service.responseTime.toFixed(0)}ms</span>
                  </div>
                )}
                {statusIcons[service.status]}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Performance Tips */}
      {diagnostics && diagnostics.summary.errors > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-red-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-500">Action Required</p>
              <p className="text-muted-foreground text-xs">
                {diagnostics.summary.errors} service(s) are experiencing issues. 
                Check error logs and verify API credentials.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
