import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || roleLoading) return;

    // Check if user has a role
    if (!role) {
      navigate("/role-selection");
      return;
    }

    // Redirect based on role
    if (role === "artist" || role === "verified_artist") {
      navigate("/studio");
    } else if (role === "listener") {
      navigate("/discover");
    } else {
      // Default fallback for other roles
      navigate("/discover");
    }
  }, [user, role, roleLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success("Account created! Choose your path...");
        // Navigation will be handled by useEffect after user state updates
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Signed in successfully!");
        // Navigation will be handled by useEffect
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card p-8 w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <img src={tdzLogo} alt="TDZ Distribution" className="h-24 w-auto" style={{ mixBlendMode: 'screen' }} />
          <div className="text-center">
            <h1 className="text-3xl font-bold glow-text mb-2">
              TDZ Distribution
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? "Create your account" : "Sign in to continue"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-glow"
            disabled={loading}
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
