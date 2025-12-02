import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TourRecommendations = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tour_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .order("match_score", { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      toast.error("Failed to load tour recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading recommendations...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Tour Recommendations</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered venue suggestions based on your listener data
          </p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tour recommendations are generated based on your listener data. Upload and promote your music to get personalized venue suggestions!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec, idx) => (
          <Card 
            key={idx} 
            className="glass-card p-6 hover:border-primary/60 hover:scale-102 transition-all group cursor-pointer animate-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                      <MapPin className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" />
                      {rec.city}
                      <Badge className="bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30 group-hover:scale-110 transition-transform">
                        <Star className="w-3 h-3 mr-1" />
                        {rec.match_score}% Match
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{rec.audience_size}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{rec.best_month}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{(rec.venues || []).length} venues</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(rec.venues || []).map((venue: string, vidx: number) => (
                    <Badge key={vidx} variant="outline" className="text-xs">
                      {venue}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button className="bg-gradient-to-r from-primary to-secondary group-hover:scale-110 transition-transform shadow-lg">
                  <Star className="w-4 h-4 mr-2 animate-pulse" />
                  Book Venue
                </Button>
                <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary transition-colors">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}

      <Card className="glass-card p-6 bg-accent/10 border-accent/20">
        <div className="flex gap-3">
          <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2">Pro Tip</h4>
            <p className="text-sm text-muted-foreground">
              Plan your tour 3-4 months in advance for better venue availability. 
              Connect your social media accounts for more personalized recommendations.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
