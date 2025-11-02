import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";
import { z } from "zod";

// Security: Input validation schema
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

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
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
    setValidationErrors({});

    try {
      // Security: Validate input before sending to server
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
          // Security: Don't expose detailed error messages
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
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
        toast.success("Account created! Choose your path...");
      } else {
        const { error } = await signIn(result.data.email, result.data.password);
        if (error) {
          // Security: Generic error message to prevent user enumeration
          toast.error("Invalid email or password.");
          setLoading(false);
          return;
        }
        toast.success("Signed in successfully!");
      }
    } catch (error: any) {
      // Security: Don't log sensitive data in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth error:', error);
      }
      toast.error("Authentication failed. Please try again.");
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
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }}
              required
              autoComplete="email"
              className="bg-background/50 border-border/50 focus:border-primary/50"
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
              className="bg-background/50 border-border/50 focus:border-primary/50"
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
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            )}
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
