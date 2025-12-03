import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GraduationCap, Play, Clock, Users, 
  Star, CheckCircle2, BookOpen, Video, FileText, Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

export const MasterClasses = () => {
  const { user } = useAuth();
  const { getPlan } = useSubscription(user);
  const [masterclasses, setMasterclasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const plan = getPlan();
  const isEnterprise = plan === 'enterprise';

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

  const handleStartCourse = (course: any) => {
    setSelectedCourse(course);
  };

  const getCoursePrice = (course: any) => {
    if (isEnterprise) return "Included";
    return course.price;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-display font-bold">Master Classes</h2>
            <p className="text-sm text-muted-foreground">
              Learn from industry professionals and grow your career
            </p>
          </div>
        </div>
        {isEnterprise && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            All Classes Included
          </Badge>
        )}
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
          <Card key={idx} className="bg-card/50 border-border/50 overflow-hidden hover:border-primary/60 transition-all group">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{course.thumbnail || "📚"}</div>
                <Badge 
                  variant={course.level === "Beginner" ? "default" : 
                          course.level === "Intermediate" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {course.level}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
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
                    {course.enrolled?.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {course.rating}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(course.topics || []).slice(0, 3).map((topic: string, tidx: number) => (
                    <Badge key={tidx} variant="outline" className="text-xs bg-muted/50">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className={`text-sm font-semibold ${
                    isEnterprise || course.price?.includes("Free") ? "text-green-500" : "text-foreground"
                  }`}>
                    {getCoursePrice(course)}
                  </span>
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => handleStartCourse(course)}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Course
              </Button>
            </div>
          </Card>
          ))}
        </div>
      )}

      <Card className="p-6 bg-accent/10 border-accent/20">
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

      {/* Course Content Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-primary" />
              {selectedCourse?.title}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Course Header */}
              <div className="flex items-start gap-4 pb-4 border-b border-border/50">
                <div className="text-6xl">{selectedCourse?.thumbnail || "📚"}</div>
                <div className="flex-1">
                  <p className="text-muted-foreground mb-2">
                    Instructor: <span className="text-foreground font-medium">{selectedCourse?.instructor}</span>
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedCourse?.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {selectedCourse?.enrolled?.toLocaleString() || 0} enrolled
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      {selectedCourse?.rating} rating
                    </div>
                  </div>
                  <Badge variant="outline">{selectedCourse?.level}</Badge>
                </div>
              </div>

              {/* Course Topics */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  What You'll Learn
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {(selectedCourse?.topics || []).map((topic: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Modules */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Course Modules
                </h3>
                <div className="space-y-2">
                  {[
                    "Module 1: Introduction & Overview",
                    "Module 2: Core Concepts & Foundations",
                    "Module 3: Practical Applications",
                    "Module 4: Advanced Techniques",
                    "Module 5: Case Studies & Examples",
                    "Module 6: Final Project & Certificate"
                  ].map((module, idx) => (
                    <Card key={idx} className="p-4 bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {idx + 1}
                          </div>
                          <span className="font-medium">{module}</span>
                        </div>
                        <Play className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Downloadable Resources
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  <Card className="p-3 bg-card/50 border-border/50 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm">Course Workbook (PDF)</span>
                  </Card>
                  <Card className="p-3 bg-card/50 border-border/50 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm">Templates & Checklists</span>
                  </Card>
                  <Card className="p-3 bg-card/50 border-border/50 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm">Resource Links</span>
                  </Card>
                  <Card className="p-3 bg-card/50 border-border/50 flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span className="text-sm">Certificate of Completion</span>
                  </Card>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4 border-t border-border/50">
                <Button 
                  className="w-full h-12 text-lg bg-gradient-to-r from-primary to-primary-glow"
                  onClick={() => {
                    toast.success("Course started!", {
                      description: `You've enrolled in "${selectedCourse?.title}". Start learning!`
                    });
                    setSelectedCourse(null);
                  }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Begin Course
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
