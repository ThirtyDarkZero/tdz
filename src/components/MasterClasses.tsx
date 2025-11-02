import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, Play, Clock, Users, 
  Star, CheckCircle2, Lock 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MasterClasses = () => {
  const [masterclasses, setMasterclasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMasterClasses();
  }, []);

  const loadMasterClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("master_classes")
        .select("*")
        .eq("available", true)
        .order("rating", { ascending: false });

      if (error) throw error;
      setMasterclasses(data || []);
    } catch (error) {
      console.error("Error loading master classes:", error);
      toast.error("Failed to load master classes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading master classes...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Master Classes</h2>
          <p className="text-sm text-muted-foreground">
            Learn from industry professionals and grow your career
          </p>
        </div>
      </div>

      {masterclasses.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Master Classes Available</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for new courses from industry professionals!
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {masterclasses.map((course, idx) => (
          <Card key={idx} className="glass-card overflow-hidden hover:border-primary/60 transition-all">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{course.thumbnail}</div>
                <Badge 
                  variant={course.level === "Beginner" ? "default" : 
                          course.level === "Intermediate" ? "secondary" : "outline"}
                >
                  {course.level}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  by {course.instructor}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.enrolled}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {course.rating}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(course.topics || []).map((topic: string, tidx: number) => (
                    <Badge key={tidx} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className={`text-sm font-semibold ${
                    course.price.includes("Free") ? "text-green-500" : "text-foreground"
                  }`}>
                    {course.price}
                  </span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={!course.available}
              >
                {course.available ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Course
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Coming Soon
                  </>
                )}
              </Button>
            </div>
          </Card>
          ))}
        </div>
      )}

      <Card className="glass-card p-6 bg-accent/10 border-accent/20">
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2">What's Included</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• HD video lessons with downloadable resources</li>
              <li>• Direct Q&A sessions with instructors</li>
              <li>• Lifetime access to course materials</li>
              <li>• Certificate of completion</li>
              <li>• Private community forum with fellow artists</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
