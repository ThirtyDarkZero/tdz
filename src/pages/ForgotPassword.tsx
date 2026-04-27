import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import tdzLogo from "@/assets/tdz-logo.png";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255).toLowerCase();

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send reset email", { description: error.message });
      return;
    }
    setSent(true);
    toast.success("Check your inbox for a reset link and code.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-coral/10 rounded-full blur-[120px]" />
      </div>
      <Card className="glass-card p-8 w-full max-w-md space-y-6 relative z-10 border-border/50">
        <div className="flex flex-col items-center gap-3">
          <img src={tdzLogo} alt="TDZ" className="h-16 w-auto" style={{ mixBlendMode: "screen" }} />
          <h1 className="text-2xl font-display font-bold">RESET PASSWORD</h1>
          <p className="text-muted-foreground text-sm text-center">
            {sent
              ? "We sent a reset link to your inbox. Click it to set a new password."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 font-semibold"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="w-full text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
        </Button>
      </Card>
    </div>
  );
}
