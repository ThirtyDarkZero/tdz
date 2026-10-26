import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Headphones, Users, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";
import { useAuthContext } from "@/contexts/AuthContext";
import { RequireNoRole } from "@/components/auth/AuthGuard";

type SelectedRole = "artist" | "listener" | "manager";

function RoleSelectionForm() {
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [artistName, setArtistName] = useState("");
  // Demographic fields for listeners
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [discoverySource, setDiscoverySource] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { user, refreshRole } = useAuthContext();

  const GENRES = ["Hip-Hop", "R&B", "Pop", "Rock", "Latin", "Jazz", "Dance", "Afrobeats", "Country", "Electronic", "Indie", "Classical", "Reggae", "Metal"];

  const toggleGenre = (genre: string) => {
    setFavoriteGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre].slice(0, 5));
  };

  const handleSubmit = async () => {
    if (!selectedRole || !displayName) {
      toast.error("Please complete all fields");
      return;
    }

    if (!user) {
      toast.error("Not authenticated");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: user.id, role: selectedRole, granted_at: new Date().toISOString() },
          { onConflict: 'user_id,role', ignoreDuplicates: true }
        );

      if (roleError) throw roleError;

      await supabase
        .from("user_subscriptions")
        .upsert(
          { user_id: user.id, plan: 'free', status: 'active' },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );

      if (selectedRole === "artist" || selectedRole === "manager") {
        const { data: existingProfile } = await supabase
          .from("artist_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from("artist_profiles")
            .insert({
              user_id: user.id,
              artist_name: artistName || displayName,
              bio: bio || null,
            });

          if (profileError) throw profileError;
        }
        
        toast.success("Welcome to TDZ Distribution!", {
          description: "Upgrade to Starter ($9.99/mo) to unlock all features",
        });
        
        await refreshRole();
        navigate("/studio");
      } else {
        const { data: existingProfile } = await supabase
          .from("listener_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from("listener_profiles")
            .insert({
              user_id: user.id,
              display_name: displayName,
              bio: bio || null,
              gender: gender || null,
              age_range: ageRange || null,
              discovery_source: discoverySource || null,
              favorite_genres: favoriteGenres.length > 0 ? favoriteGenres : null,
            });

          if (profileError) throw profileError;
        }
        
        toast.success("Welcome to TDZ Distribution!", {
          description: "Subscribe for $12/mo for unlimited streaming",
        });
        
        await refreshRole();
        navigate("/discover");
      }
    } catch (error: any) {
      console.error("Role selection error:", error);
      toast.error(error.message || "Failed to set up profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} 
        />
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="relative z-10 max-w-4xl w-full glass-card p-8 md:p-12 border-primary/30">
        <div className="flex justify-center mb-8">
          <img src={tdzLogo} alt="TDZ Distribution" className="h-24 w-auto object-contain" />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              CHOOSE YOUR PATH
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Are you here to create or to discover?
          </p>
        </div>

        {!selectedRole ? (
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="relative group cursor-pointer glass-card p-8 hover:border-primary transition-all duration-300 hover:scale-105" onClick={() => setSelectedRole("artist")}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Music className="w-10 h-10 text-background" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">ARTIST</h3>
                  <p className="text-muted-foreground">Distribute your music to millions worldwide</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary">I'm an Artist<ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </Card>

            <Card className="relative group cursor-pointer glass-card p-8 hover:border-accent transition-all duration-300 hover:scale-105" onClick={() => setSelectedRole("manager")}>
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-background" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">MANAGER</h3>
                  <p className="text-muted-foreground">Manage artists and grow your roster</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-accent to-primary">I'm a Manager<ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </Card>

            <Card className="relative group cursor-pointer glass-card p-8 hover:border-secondary transition-all duration-300 hover:scale-105" onClick={() => setSelectedRole("listener")}>
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-10 h-10 text-background" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">FAN</h3>
                  <p className="text-muted-foreground">Discover music and connect with artists</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-secondary to-accent">I'm a Fan<ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                {selectedRole === "artist" ? <Music className="w-8 h-8 text-background" /> : selectedRole === "manager" ? <Users className="w-8 h-8 text-background" /> : <Headphones className="w-8 h-8 text-background" />}
              </div>
              <h2 className="text-2xl font-display font-bold">
                {selectedRole === "artist" ? "Artist Profile" : selectedRole === "manager" ? "Manager Profile" : "Fan Profile"}
              </h2>
            </div>

            <div className="space-y-4">
              {(selectedRole === "artist" || selectedRole === "manager") && (
                <div>
                  <Label htmlFor="artistName">{selectedRole === "artist" ? "Artist Name *" : "Company/Manager Name *"}</Label>
                  <Input id="artistName" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder={selectedRole === "artist" ? "Your stage name" : "Your management company"} className="mt-2" />
                </div>
              )}

              <div>
                <Label htmlFor="displayName">{selectedRole === "artist" ? "Display Name *" : "Your Name *"}</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How should we call you?" className="mt-2" />
              </div>

              {/* Demographics for listeners */}
              {selectedRole === "listener" && (
                <>
                  <div>
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-Binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Age Range</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Select age range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="13-17">13-17</SelectItem>
                        <SelectItem value="18-24">18-24</SelectItem>
                        <SelectItem value="25-34">25-34</SelectItem>
                        <SelectItem value="35-44">35-44</SelectItem>
                        <SelectItem value="45-54">45-54</SelectItem>
                        <SelectItem value="55+">55+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>How did you discover TDZ?</Label>
                    <Select value={discoverySource} onValueChange={setDiscoverySource}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="friend">Friend / Word of Mouth</SelectItem>
                        <SelectItem value="search">Search Engine</SelectItem>
                        <SelectItem value="artist-referral">Artist Referral</SelectItem>
                        <SelectItem value="ad">Advertisement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Favorite Genres (up to 5)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {GENRES.map(genre => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            favoriteGenres.includes(genre) 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." className="mt-2" rows={3} />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setSelectedRole(null)} className="flex-1" disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-primary to-secondary" disabled={loading || !displayName}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue<ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function RoleSelection() {
  return (
    <RequireNoRole>
      <RoleSelectionForm />
    </RequireNoRole>
  );
}
