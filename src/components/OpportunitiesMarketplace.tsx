import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, DollarSign, Calendar, Users, 
  TrendingUp, Star, Music, Film 
} from "lucide-react";

const opportunities = [
  {
    title: "Netflix Series Sync Placement",
    type: "Sync Licensing",
    budget: "$5,000 - $15,000",
    deadline: "March 15, 2025",
    genre: ["Pop", "Indie"],
    status: "Hot",
    description: "Seeking upbeat indie-pop tracks for upcoming teen drama series",
    icon: Film,
    color: "from-red-500 to-orange-500"
  },
  {
    title: "Brand Campaign - Athletic Wear",
    type: "Brand Partnership",
    budget: "$10,000 - $25,000",
    deadline: "March 20, 2025",
    genre: ["Electronic", "Hip-Hop"],
    status: "Exclusive",
    description: "Major athletic brand seeking high-energy tracks for spring campaign",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Festival Headliner Opening Act",
    type: "Performance",
    budget: "$3,000 + Exposure",
    deadline: "April 1, 2025",
    genre: ["Rock", "Alternative"],
    status: "Featured",
    description: "Open for major headliner at 50K capacity summer festival",
    icon: Users,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Video Game Soundtrack",
    type: "Sync Licensing",
    budget: "$8,000 - $20,000",
    deadline: "March 30, 2025",
    genre: ["Electronic", "Ambient"],
    status: "New",
    description: "Indie game studio needs atmospheric tracks for open-world adventure",
    icon: Music,
    color: "from-green-500 to-emerald-500"
  },
];

export const OpportunitiesMarketplace = () => {
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

      <div className="grid gap-4">
        {opportunities.map((opp, idx) => (
          <Card key={idx} className="glass-card p-6 hover:border-primary/60 transition-all">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${opp.color} flex items-center justify-center flex-shrink-0`}>
                <opp.icon className="w-8 h-8 text-white" />
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
                  {opp.genre.map((g, gidx) => (
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
        ))}
      </div>

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
