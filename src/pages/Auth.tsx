import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/contexts/AuthContext";
import { RequireGuest } from "@/components/auth/AuthGuard";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";
import { z } from "zod";
import { Chrome, Loader2, Apple } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";

// Security: Input validation schemas
const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .toLowerCase(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password must be less than 72 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
});

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, signInWithGoogle } = useAuthContext();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("provider is not enabled") || msg.includes("not enabled")) {
          toast.error("Google sign-in is not enabled", {
            description: "An admin needs to enable Google in Lovable Cloud → Auth Settings.",
          });
        } else if (msg.includes("popup") || msg.includes("blocked")) {
          toast.error("Popup blocked", { description: "Allow popups for this site and try again." });
        } else {
          toast.error("Google sign-in failed", { description: error.message || "Please try again." });
        }
      }
    } catch (e) {
      toast.error("Google sign-in failed", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      const schema = isSignUp ? authSchema : signInSchema;
      const result = schema.safeParse({ email, password });

      if (!result.success) {
        const errors: { email?: string; password?: string } = {};
        result.error.issues.forEach((err) => {
          if (err.path[0] === "email") errors.email = err.message;
          if (err.path[0] === "password") errors.password = err.message;
        });
        setValidationErrors(errors);
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { error } = await signUp(result.data.email, result.data.password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Check your email and confirm your account before signing in.");
          } else if (error.message.includes("Invalid email")) {
            toast.error("Please enter a valid email address.");
          } else if (error.message.includes("Password")) {
            toast.error("Password does not meet security requirements.");
          } else {
            toast.error("Unable to create account. Please try again.");
          }
          setLoading(false);
          return;
        }
        toast.success("Account created!");
        // AuthContext will handle the redirect via RequireGuest
      } else {
        const { error } = await signIn(result.data.email, result.data.password);
        if (error) {
          const message = error.message?.toLowerCase?.() || "";
          if (message.includes("email not confirmed") || message.includes("email_not_confirmed")) {
            toast.error("Please confirm your email before signing in.");
          } else if (message.includes("too many requests") || message.includes("rate limit")) {
            toast.error("Too many sign-in attempts. Please wait a moment and try again.");
          } else if (message.includes("invalid login credentials")) {
            toast.error("Invalid email or password.");
          } else {
            toast.error(error.message || "Unable to sign in right now.");
          }
          setLoading(false);
          return;
        }
        toast.success("Signed in successfully!");
        // AuthContext will handle the redirect via RequireGuest
      }
    } catch {
      toast.error("Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px]" />
      </div>
      
      <Card className="glass-card p-8 w-full max-w-md space-y-6 relative z-10 border-border/50">
        <div className="flex flex-col items-center gap-4">
          <img src={tdzLogo} alt="TDZ Distribution" className="h-20 w-auto" style={{ mixBlendMode: 'screen' }} />
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
              TDZ DISTRIBUTION
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Create your account" : "Sign in to continue"}
            </p>
          </div>
        </div>

        {/* Google Sign-In */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 gap-3 border-border/50 hover:bg-muted/50"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Chrome className="w-5 h-5" />
          )}
          Continue with Google
        </Button>

        <div className="relative">
          <Separator className="bg-border/50" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }}
              required
              autoComplete="email"
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {validationErrors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationErrors((prev) => ({ ...prev, password: undefined }));
              }}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={isSignUp ? 8 : 1}
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? "password-error" : undefined}
            />
            {validationErrors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {validationErrors.password}
              </p>
            )}
            {isSignUp && !validationErrors.password && (
              <p className="text-xs text-muted-foreground">
                Min 8 characters with uppercase, lowercase, and numbers
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 hover:shadow-glow font-semibold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm space-y-3">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
          
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Home
            </Button>
          </div>
        </div>

        {/* Security note */}
        <p className="text-[10px] text-center text-muted-foreground/60">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  );
}

// Wrap with RequireGuest to handle redirects
export default function Auth() {
  return (
    <RequireGuest>
      <AuthForm />
    </RequireGuest>
  );
}