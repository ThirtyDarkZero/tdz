import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Loader2, Mail, MessageSquare, ShieldAlert } from "lucide-react";
import type { IdentityDossier } from "@/hooks/useIdentityDossier";

interface Props {
  dossier: IdentityDossier;
  accent: string;
}

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] tracking-[0.3em] text-white/60 font-bold">{label.toUpperCase()}</Label>
      {children}
    </div>
  );
}

export function IdentityDossierFields({ dossier, accent }: Props) {
  const { values, set, emailVerified, phoneVerified, busy, otpSent, otpCode, setOtpCode, age } = dossier;

  const inputStyle = {
    background: "rgba(0,0,0,0.4)",
    fontFamily: "'Raleway',sans-serif",
  } as React.CSSProperties;

  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = accent;
    e.currentTarget.style.boxShadow = `0 0 20px ${accent}40`;
  };
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
    e.currentTarget.style.boxShadow = "none";
  };

  const cls = "h-12 text-white placeholder:text-white/30 border-white/15 focus-visible:ring-0 transition-all";

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] text-white/60"
        style={{ borderColor: `${accent}40`, background: `${accent}10`, fontFamily: "'Raleway',sans-serif" }}
      >
        <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
        Verified identity unlocks payouts, tipping and $1/stream integrity. Your details stay private.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full legal name">
          <Input
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="e.g. Robert Hayes"
            className={cls}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </Field>

        <Field label={age !== null ? `Date of birth (age ${age})` : "Date of birth"}>
          <Input
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className={cls}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </Field>
      </div>

      {/* Email + verification */}
      <Field label="Email">
        <div className="flex gap-2">
          <Input
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            className={`${cls} flex-1`}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
          {emailVerified ? (
            <div
              className="h-12 px-3 flex items-center gap-1.5 rounded-md text-[11px] font-bold tracking-wider"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }}
            >
              <BadgeCheck className="w-4 h-4" /> VERIFIED
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={dossier.resendEmailVerification}
              disabled={busy === "email"}
              className="h-12 border-white/20 text-white/80 hover:text-white"
            >
              {busy === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-1.5" /> Verify</>}
            </Button>
          )}
        </div>
      </Field>

      {/* Phone + SMS verification */}
      <Field label="Mobile number (international format)">
        <div className="flex gap-2">
          <Input
            type="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+14155550123"
            className={`${cls} flex-1`}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
          {phoneVerified ? (
            <div
              className="h-12 px-3 flex items-center gap-1.5 rounded-md text-[11px] font-bold tracking-wider"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }}
            >
              <BadgeCheck className="w-4 h-4" /> VERIFIED
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={dossier.sendSmsCode}
              disabled={busy === "sms"}
              className="h-12 border-white/20 text-white/80 hover:text-white"
            >
              {busy === "sms" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageSquare className="w-4 h-4 mr-1.5" /> Send code</>}
            </Button>
          )}
        </div>
      </Field>

      {otpSent && !phoneVerified && (
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit SMS code"
            className={`${cls} flex-1 tracking-[0.5em] text-center`}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
          <Button
            type="button"
            onClick={dossier.verifySmsCode}
            disabled={busy === "verify"}
            className="h-12 text-white border-0"
            style={{ background: `linear-gradient(135deg, ${accent}, #a78bfa)` }}
          >
            {busy === "verify" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Country">
          <Input
            value={values.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="e.g. United States"
            className={cls}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </Field>
        <Field label="City (optional)">
          <Input
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. Atlanta"
            className={cls}
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </Field>
      </div>

      <Field label="Gender (optional)">
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => {
            const active = values.gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => set("gender", active ? "" : g)}
                className="px-3 py-2 rounded-full text-[11px] font-semibold transition-all border"
                style={{
                  borderColor: active ? accent : "rgba(255,255,255,0.15)",
                  background: active ? `${accent}20` : "rgba(0,0,0,0.4)",
                  color: active ? accent : "rgba(255,255,255,0.6)",
                  fontFamily: "'Raleway',sans-serif",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </Field>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={values.marketingOptIn}
          onChange={(e) => set("marketingOptIn", e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-current"
          style={{ accentColor: accent }}
        />
        <span className="text-[11px] text-white/60 leading-relaxed" style={{ fontFamily: "'Raleway',sans-serif" }}>
          Send me drop alerts, earnings recaps and TDZ intel. You can unsubscribe anytime.
        </span>
      </label>
    </div>
  );
}
