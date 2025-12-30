import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music, Headphones, Users, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";
import { useAuth } from "@/hooks/useAuth";

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<"artist" | "listener" | "manager" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [existingRole, setExistingRole] = useState<string | null>(null);

  // Check if user already has a role AND the required profile exists.
  // If the profile is missing, keep the user here to finish setup (prevents Studio <-> RoleSelection loops).
  const [checkingRole, setCheckingRole] = useState(true);

  const finishSetupToastShownRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const normalizeRoleForSetup = (dbRole: string): "artist" | "listener" | "manager" | null => {
      if (dbRole === "listener") return "listener";
      if (dbRole === "manager") return "manager";
      if (dbRole === "artist" || dbRole === "verified_artist") return "artist";
      return null;
    };

    const checkExistingProfile = async () => {
      try {
        if (authLoading) return;

        if (!user) {
          // Not authenticated → route to auth and stop the loading screen
          if (!cancelled) setCheckingRole(false);
          navigate("/auth", { replace: true });
          return;
        }

        // Get the latest role (matches Studio's role resolution)
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .order("granted_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (roleError) {
          console.error("Error loading existing role:", roleError);
          return;
        }

        const dbRole = roleData?.role;
        if (!dbRole) return;

        setExistingRole(dbRole);

        // Verify profile exists for this role before redirecting away
        if (dbRole === "listener") {
          const { data: listenerProfile, error: profileError } = await supabase
            .from("listener_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (cancelled) return;
          if (profileError) console.error("Error checking listener profile:", profileError);

          if (listenerProfile) {
            navigate("/discover", { replace: true });
            return;
          }

          // Missing profile → let them finish setup here
          setSelectedRole("listener");
          if (!finishSetupToastShownRef.current) {
            finishSetupToastShownRef.current = true;
            toast.info("Finish setup", {
              description: "Complete your fan profile to continue.",
            });
          }
          return;
        }

        // Artist / Manager / Verified Artist all use artist_profiles in this app
        const { data: artistProfile, error: profileError } = await supabase
          .from("artist_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;
        if (profileError) console.error("Error checking artist profile:", profileError);

        if (artistProfile) {
          navigate("/studio", { replace: true });
          return;
        }

        // Missing profile → let them finish setup here
        const normalized = normalizeRoleForSetup(dbRole);
        if (normalized) {
          setSelectedRole(normalized);
          if (!finishSetupToastShownRef.current) {
            finishSetupToastShownRef.current = true;
            toast.info("Finish setup", {
              description: "Complete your profile to access Studio.",
            });
          }
        }
      } catch (error) {
        console.error("RoleSelection bootstrap error:", error);
      } finally {
        if (!cancelled) setCheckingRole(false);
      }
    };

    checkExistingProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate, user, authLoading]);

  const handleSubmit = async () => {
    if (!selectedRole || !displayName) {
      toast.error("Please complete all fields");
      return;
    }

    // Prevent artists/managers from creating listener accounts
    if (existingRole && (existingRole === 'artist' || existingRole === 'verified_artist' || existingRole === 'manager') && selectedRole === 'listener') {
      toast.error("Artists and managers cannot create fan accounts");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

        // Assign role (using upsert to handle duplicates gracefully)
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: user.id, role: selectedRole, granted_at: new Date().toISOString() },
            { onConflict: 'user_id,role', ignoreDuplicates: true }
          );

      if (roleError) throw roleError;

      // Create initial subscription (free plan - users must upgrade)
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .upsert(
          { 
            user_id: user.id, 
            plan: 'free',
            status: 'active'
          },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );

      if (subError) {
        console.error("Subscription creation error:", subError);
        // Don't block signup if subscription creation fails
      }

      // Create profile based on role
      if (selectedRole === "artist" || selectedRole === "manager") {
        // Check if artist profile already exists
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
        
        // Show upgrade prompt for artists
        toast.success("Welcome to TDZ Distribution!", {
          description: "Upgrade to Starter ($9.99/mo) to unlock all features",
        });
        navigate("/studio");
      } else {
        // Check if listener profile already exists
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
            });

          if (profileError) throw profileError;
        }
        
        // Show upgrade prompt for fans
        toast.success("Welcome to TDZ Distribution!", {
          description: "Subscribe for $12/mo for unlimited streaming",
        });
        navigate("/discover");
      }
    } catch (error: any) {
      console.error("Role selection error:", error);
      toast.error(error.message || "Failed to set up profile");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking for existing role
  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} 
        />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="relative z-10 max-w-4xl w-full glass-card p-8 md:p-12 border-primary/30">
        {/* Logo */}
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
            {/* Show warning if artist/manager trying to create listener account */}
            {existingRole && (existingRole === 'artist' || existingRole === 'verified_artist' || existingRole === 'manager') && (
              <div className="col-span-full mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-center">
                <p className="text-sm text-destructive font-medium">
                  You already have an artist/manager account. You cannot create a fan account.
                </p>
              </div>
            )}
            {/* Artist Card */}
            <Card
              className="relative group cursor-pointer glass-card p-8 hover:border-primary transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedRole("artist")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Music className="w-10 h-10 text-background" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">ARTIST</h3>
                  <p className="text-muted-foreground">
                    Distribute your music to millions worldwide
                  </p>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                  I'm an Artist
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* Manager Card */}
            <Card
              className="relative group cursor-pointer glass-card p-8 hover:border-accent transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedRole("manager")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-background" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">MANAGER</h3>
                  <p className="text-muted-foreground">
                    Manage artists and grow your roster
                  </p>
                </div>
                <Button className="w-full bg-gradient-to-r from-accent to-primary">
                  I'm a Manager
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* Listener Card */}
            <Card
              className={`relative group glass-card p-8 hover:border-secondary transition-all duration-300 ${
                existingRole && (existingRole === 'artist' || existingRole === 'verified_artist' || existingRole === 'manager')
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-105'
              }`}
              onClick={() => {
                if (existingRole && (existingRole === 'artist' || existingRole === 'verified_artist' || existingRole === 'manager')) {
                  toast.error("Artists and managers cannot create fan accounts");
                  return;
                }
                setSelectedRole("listener");
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-10 h-10 text-background" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">FAN</h3>
                  <p className="text-muted-foreground">
                    Discover music and connect with artists
                  </p>
                </div>
                <Button className="w-full bg-gradient-to-r from-secondary to-accent">
                  I'm a Fan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                {selectedRole === "artist" ? (
                  <Music className="w-8 h-8 text-background" />
                ) : selectedRole === "manager" ? (
                  <Users className="w-8 h-8 text-background" />
                ) : (
                  <Headphones className="w-8 h-8 text-background" />
                )}
              </div>
              <h2 className="text-2xl font-display font-bold">
                {selectedRole === "artist" ? "Artist Profile" : selectedRole === "manager" ? "Manager Profile" : "Fan Profile"}
              </h2>
            </div>

            <div className="space-y-4">
              {(selectedRole === "artist" || selectedRole === "manager") && (
                <div>
                  <Label htmlFor="artistName">
                    {selectedRole === "artist" ? "Artist Name *" : "Company/Manager Name *"}
                  </Label>
                  <Input
                    id="artistName"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder={selectedRole === "artist" ? "Your stage name" : "Your management company"}
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="displayName">
                  {selectedRole === "artist" ? "Display Name *" : "Your Name *"}
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedRole(null)}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !displayName}
                className="flex-1 bg-gradient-to-r from-primary via-secondary to-accent"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}