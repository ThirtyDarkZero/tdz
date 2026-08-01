import { useCallback, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Requires a verified TOTP factor (AAL2) before rendering privileged content.
 * Enrolls a factor if the account has none, otherwise asks for the 6-digit code.
 */
export function AdminMfaGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [needsChallenge, setNeedsChallenge] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const evaluate = useCallback(async () => {
    setChecking(true);
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        setNeedsChallenge(false);
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f) => f.status === "verified");

      if (verified) {
        setFactorId(verified.id);
        const { data: ch, error } = await supabase.auth.mfa.challenge({ factorId: verified.id });
        if (error) throw error;
        setChallengeId(ch.id);
      } else {
        // Clean up any stale unverified factor, then enroll a fresh one.
        for (const f of factors?.totp?.filter((x) => x.status !== "verified") ?? []) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        const { data: enrolled, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `TDZ Admin ${Date.now()}`,
        });
        if (error) throw error;
        setFactorId(enrolled.id);
        setQr(enrolled.totp.qr_code);
        setSecret(enrolled.totp.secret);
      }
      setNeedsChallenge(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not verify two-factor status");
      setNeedsChallenge(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  const verify = async () => {
    if (!factorId || code.trim().length < 6) return;
    setSubmitting(true);
    try {
      let cid = challengeId;
      if (!cid) {
        const { data: ch, error } = await supabase.auth.mfa.challenge({ factorId });
        if (error) throw error;
        cid = ch.id;
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: cid!,
        code: code.trim(),
      });
      if (error) throw error;
      toast.success("Two-factor verified");
      setCode("");
      setQr(null);
      setSecret(null);
      await evaluate();
    } catch (e: any) {
      toast.error(e?.message ?? "Invalid code");
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking two-factor security...</p>
        </div>
      </div>
    );
  }

  if (!needsChallenge) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 space-y-6 border-border/60 bg-card/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {qr ? (
            <ShieldAlert className="w-8 h-8 text-primary" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-primary" />
          )}
          <div>
            <h1 className="text-2xl tracking-wide">
              {qr ? "SET UP TWO-FACTOR" : "TWO-FACTOR REQUIRED"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Admin access is protected by an authenticator app.
            </p>
          </div>
        </div>

        {qr && (
          <div className="space-y-3">
            <img
              src={qr}
              alt="Two-factor authentication QR code for admin login"
              className="w-44 h-44 mx-auto rounded-lg bg-background p-2"
            />
            {secret && (
              <p className="text-xs text-center text-muted-foreground break-all">
                Manual key: <span className="font-mono">{secret}</span>
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verify()}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            aria-label="Six digit authentication code"
          />
          <Button className="w-full" onClick={verify} disabled={submitting || code.length < 6}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default AdminMfaGate;
