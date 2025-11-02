import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, DollarSign, Calendar, Users, 
  TrendingUp, Star, Music, Film 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const getIconByType = (type: string) => {
  switch (type) {
    case "Sync Licensing": return Film;
    case "Brand Partnership": return TrendingUp;
    case "Performance": return Users;
    default: return Music;
  }
};

const getColorByType = (type: string) => {
  switch (type) {
    case "Sync Licensing": return "from-red-500 to-orange-500";
    case "Brand Partnership": return "from-blue-500 to-cyan-500";
    case "Performance": return "from-purple-500 to-pink-500";
    default: return "from-green-500 to-emerald-500";
  }
};

export const OpportunitiesMarketplace = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .gte("deadline", new Date().toISOString().split('T')[0])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error("Error loading opportunities:", error);
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading opportunities...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Exclusive Opportunities</h2>
          <p className="text-sm text-muted-foreground">
            Curated deals and placements for TDZ artists
          </p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Opportunities Available</h3>
          <p className="text-sm text-muted-foreground">
            New exclusive deals and placements are added regularly. Check back soon!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {opportunities.map((opp, idx) => {
            const Icon = getIconByType(opp.type);
            const color = getColorByType(opp.type);
            return (
              <Card key={opp.id} className="glass-card p-6 hover:border-primary/60 transition-all">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{opp.title}</h3>
                      <Badge 
                        className={
                          opp.status === "Hot" ? "bg-red-500/20 text-red-500 border-red-500/30" :
                          opp.status === "Exclusive" ? "bg-purple-500/20 text-purple-500 border-purple-500/30" :
                          opp.status === "Featured" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" :
                          "bg-green-500/20 text-green-500 border-green-500/30"
                        }
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {opp.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{opp.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">{opp.budget}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{opp.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{opp.type}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(opp.genre || []).map((g: string, gidx: number) => (
                    <Badge key={gidx} variant="outline" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:min-w-[120px]">
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  Apply Now
                </Button>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </div>
          </Card>
            );
          })}
        </div>
      )}

      <Card className="glass-card p-6 bg-primary/10 border-primary/20">
        <div className="flex gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2">How It Works</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• New opportunities added weekly based on your genre and style</li>
              <li>• TDZ negotiates deals and protects your rights</li>
              <li>• Keep 100% of sync fees and performance royalties</li>
              <li>• Our A&R team reviews submissions and makes recommendations</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
