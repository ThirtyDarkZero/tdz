import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Music, Film, Zap } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  mood: string;
  stylePreset: string;
  emotionIntensity: number;
  cameraMotion: number;
  fantasyRealism: number;
  videoProvider: string;
}

const templates: Template[] = [
  {
    id: "golden-hour",
    name: "Golden Hour Luxury",
    description: "Warm, cinematic visuals with elegant transitions. Perfect for sophisticated hip-hop and R&B.",
    icon: <Sparkles className="w-6 h-6" />,
    mood: "luxuryrap",
    stylePreset: "Golden Hour",
    emotionIntensity: 70,
    cameraMotion: 50,
    fantasyRealism: 5,
    videoProvider: "runway",
  },
  {
    id: "dark-trap",
    name: "Dark Trap",
    description: "Moody, high-contrast visuals with dramatic shadows. Ideal for trap and drill music.",
    icon: <Zap className="w-6 h-6" />,
    mood: "dark",
    stylePreset: "Cinematic",
    emotionIntensity: 85,
    cameraMotion: 70,
    fantasyRealism: 20,
    videoProvider: "runway",
  },
  {
    id: "vibrant-pop",
    name: "Vibrant Pop",
    description: "Colorful, energetic visuals with dynamic camera movements. Great for pop and dance music.",
    icon: <Music className="w-6 h-6" />,
    mood: "energetic",
    stylePreset: "Vibrant",
    emotionIntensity: 80,
    cameraMotion: 75,
    fantasyRealism: 40,
    videoProvider: "kling",
  },
  {
    id: "cinematic-story",
    name: "Cinematic Story",
    description: "Movie-quality visuals with narrative focus. Perfect for storytelling tracks.",
    icon: <Film className="w-6 h-6" />,
    mood: "contemplative",
    stylePreset: "Film Noir",
    emotionIntensity: 75,
    cameraMotion: 40,
    fantasyRealism: 15,
    videoProvider: "sora",
  },
  {
    id: "dreamy-abstract",
    name: "Dreamy Abstract",
    description: "Surreal, ethereal visuals with smooth transitions. Ideal for experimental and ambient music.",
    icon: <Sparkles className="w-6 h-6" />,
    mood: "dreamy",
    stylePreset: "Ethereal",
    emotionIntensity: 60,
    cameraMotion: 30,
    fantasyRealism: 80,
    videoProvider: "veo",
  },
  {
    id: "gritty-street",
    name: "Gritty Street",
    description: "Raw, documentary-style visuals. Perfect for authentic street hip-hop.",
    icon: <Music className="w-6 h-6" />,
    mood: "aggressive",
    stylePreset: "Documentary",
    emotionIntensity: 90,
    cameraMotion: 60,
    fantasyRealism: 5,
    videoProvider: "runway",
  },
];

export const TemplatesList = () => {
  const { createProject } = useProject();

  const useTemplate = async (template: Template) => {
    try {
      const newProject = await createProject();
      
      if (newProject) {
        toast.success(`Started new project with ${template.name} template`);
        toast.info("Upload audio to begin creating your video");
      }
    } catch (error) {
      console.error("Error creating project from template:", error);
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Video Templates</h2>
        <p className="text-muted-foreground">
          Start your music video with a professionally designed template
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mood:</span>
                  <span className="font-medium capitalize">{template.mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style:</span>
                  <span className="font-medium">{template.stylePreset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intensity:</span>
                  <span className="font-medium">{template.emotionIntensity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium capitalize">{template.videoProvider}</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => useTemplate(template)}
              >
                Use Template
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
