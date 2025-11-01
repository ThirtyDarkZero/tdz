import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Sparkles, Calendar, Image, Video, 
  FileText, TrendingUp, Target, Lightbulb 
} from "lucide-react";
import { toast } from "sonner";

// Pillar 2: Authentic Storytelling Capacity
export const StorytellingStudio = () => {
  const [narrativeStrength, setNarrativeStrength] = useState(67);

  const templates = [
    {
      title: "The Underdog Journey",
      description: "From bedroom producer to breakthrough artist",
      strength: "Relatability, inspiration",
      example: "Started making beats on a laptop, now..."
    },
    {
      title: "The Collaborator",
      description: "Building through connections and features",
      strength: "Network effect, credibility",
      example: "Working with artists you love opens doors..."
    },
    {
      title: "The Innovator",
      description: "Pushing boundaries in your genre",
      strength: "Differentiation, thought leadership",
      example: "Blending [genre] with [genre] in ways no one has..."
    },
    {
      title: "The Storyteller",
      description: "Every song tells part of your life",
      strength: "Emotional connection, authenticity",
      example: "Each track is a chapter in my story..."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-display font-bold">Storytelling Studio</h2>
          <p className="text-sm text-muted-foreground">
            Build a narrative that makes people invest in your journey
          </p>
        </div>
      </div>

      {/* Narrative Strength Score */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Narrative Strength
            </span>
            <Badge className="bg-primary/20 text-primary text-lg px-3 py-1">
              {narrativeStrength}/100
            </Badge>
          </CardTitle>
          <CardDescription>
            People invest in journeys, not just music. Strengthen your story.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Origin Story</span>
              <span className="text-primary font-semibold">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Visual Identity</span>
              <span className="text-yellow-500 font-semibold">60%</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Consistent Voice</span>
              <span className="text-green-500 font-semibold">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Content Cadence</span>
              <span className="text-red-500 font-semibold">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="narrative" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="visuals">Visuals</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* Narrative Templates */}
        <TabsContent value="narrative" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Choose Your Narrative Arc
              </CardTitle>
              <CardDescription>
                Select a framework that aligns with your authentic story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((template, idx) => (
                <Card key={idx} className="p-4 hover:border-primary/60 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{template.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.strength}
                        </Badge>
                      </div>
                      <p className="text-xs italic text-muted-foreground">
                        "{template.example}"
                      </p>
                    </div>
                    <Button size="sm">Select</Button>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Your Story Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Origin Story (Where you started)</Label>
                <Textarea 
                  placeholder="Where did your journey begin? What sparked your passion for music?"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Defining Moment (The breakthrough)</Label>
                <Textarea 
                  placeholder="What moment changed everything? A specific challenge you overcame?"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Current Chapter (Where you are now)</Label>
                <Textarea 
                  placeholder="What are you working on? What's driving you forward?"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Future Vision (Where you're going)</Label>
                <Textarea 
                  placeholder="What's the ultimate goal? What impact do you want to make?"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <Button className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Story Arc
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Library */}
        <TabsContent value="content" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Content Library
              </CardTitle>
              <CardDescription>
                Behind-the-scenes, process, journey moments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <Card className="p-4 hover:border-primary/60 transition-all cursor-pointer">
                  <Video className="w-8 h-8 text-primary mb-2" />
                  <p className="font-semibold text-sm mb-1">Studio Sessions</p>
                  <p className="text-xs text-muted-foreground mb-2">12 videos</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Manage
                  </Button>
                </Card>

                <Card className="p-4 hover:border-primary/60 transition-all cursor-pointer">
                  <Image className="w-8 h-8 text-primary mb-2" />
                  <p className="font-semibold text-sm mb-1">Behind the Scenes</p>
                  <p className="text-xs text-muted-foreground mb-2">47 photos</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Manage
                  </Button>
                </Card>

                <Card className="p-4 hover:border-primary/60 transition-all cursor-pointer">
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <p className="font-semibold text-sm mb-1">Stories</p>
                  <p className="text-xs text-muted-foreground mb-2">8 posts</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Manage
                  </Button>
                </Card>
              </div>

              <Card className="p-4 bg-primary/10 border-primary/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Content Strategy Tips
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Show your process, not just the finished product</li>
                  <li>• Share failures and challenges - makes success meaningful</li>
                  <li>• Create recurring series (Monday studio updates, Friday advice)</li>
                  <li>• Let people see YOU, not just the artist persona</li>
                </ul>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Identity */}
        <TabsContent value="visuals" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Visual Identity System
              </CardTitle>
              <CardDescription>
                Consistent look and feel across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <Label className="mb-2 block">Color Palette</Label>
                  <div className="flex gap-2 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary" />
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500" />
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Edit Colors
                  </Button>
                </Card>

                <Card className="p-4">
                  <Label className="mb-2 block">Typography</Label>
                  <div className="space-y-2 mb-3">
                    <div className="p-2 rounded bg-muted">
                      <p className="font-bold">Heading Font</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-sm">Body Font</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Edit Fonts
                  </Button>
                </Card>
              </div>

              <Card className="p-4">
                <Label className="mb-2 block">Visual Style</Label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs">
                    Moody
                  </div>
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs">
                    Vibrant
                  </div>
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs">
                    Minimal
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Generate Style Guide
                </Button>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Content Calendar
              </CardTitle>
              <CardDescription>
                Plan your narrative across time - consistency builds momentum
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => (
                  <Card 
                    key={i} 
                    className={`aspect-square p-2 cursor-pointer hover:border-primary/60 transition-all ${
                      i % 7 === 2 || i % 7 === 5 ? 'border-primary/30' : ''
                    }`}
                  >
                    <div className="text-xs">{i + 1}</div>
                    {i % 7 === 2 && (
                      <Badge className="text-[10px] px-1 py-0 mt-1">Post</Badge>
                    )}
                    {i % 7 === 5 && (
                      <Badge className="text-[10px] px-1 py-0 mt-1" variant="secondary">BTS</Badge>
                    )}
                  </Card>
                ))}
              </div>

              <Card className="p-4 bg-primary/10 border-primary/30">
                <h4 className="font-semibold mb-2">Recommended Cadence</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Instagram Stories</span>
                    <Badge variant="secondary">Daily</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Main Feed Post</span>
                    <Badge variant="secondary">3x/week</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>YouTube/TikTok</span>
                    <Badge variant="secondary">2x/week</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Newsletter</span>
                    <Badge variant="secondary">Weekly</Badge>
                  </div>
                </div>
              </Card>

              <Button className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Auto-Schedule Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};