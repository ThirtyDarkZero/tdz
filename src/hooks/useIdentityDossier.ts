import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export interface IdentityDossierState {
  fullName: string;
  dateOfBirth: string; // yyyy-mm-dd
  email: string;
  phone: string;
  country: string;
  city: string;
  gender: string;
  marketingOptIn: boolean;
}

const EMPTY: IdentityDossierState = {
  fullName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  gender: "",
  marketingOptIn: true,
};

export function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

const E164 = /^\+[1-9]\d{7,14}$/;

export function useIdentityDossier() {
  const { user } = useAuthContext();
  const [values, setValues] = useState<IdentityDossierState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [busy, setBusy] = useState<null | "email" | "sms" | "verify">(null);

  const emailVerified = Boolean((user as any)?.email_confirmed_at);
  const phoneVerified = Boolean(phoneVerifiedAt || (user as any)?.phone_confirmed_at);

  const set = useCallback(<K extends keyof IdentityDossierState>(key: K, v: IdentityDossierState[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  }, []);

  // Hydrate from an existing profile / auth metadata.
  useEffect(() => {
    if (!user || loaded) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, date_of_birth, email, phone, country, city, gender, marketing_opt_in, phone_verified_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      setValues({
        fullName: data?.full_name || meta.full_name || meta.name || "",
        dateOfBirth: data?.date_of_birth || "",
        email: data?.email || user.email || "",
        phone: data?.phone || (user as any).phone || "",
        country: data?.country || "",
        city: data?.city || "",
        gender: data?.gender || "",
        marketingOptIn: data?.marketing_opt_in ?? true,
      });
      setPhoneVerifiedAt(data?.phone_verified_at ?? null);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loaded]);

  const validate = useCallback((): string | null => {
    if (values.fullName.trim().length < 2) return "Enter your full legal name.";
    const age = ageFromDob(values.dateOfBirth);
    if (age === null) return "Enter your date of birth.";
    if (age < 13) return "You must be at least 13 to join TDZ.";
    if (age > 120) return "That date of birth doesn't look right.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return "Enter a valid email address.";
    if (!E164.test(values.phone.trim())) return "Enter your phone in international format, e.g. +14155550123.";
    if (!values.country.trim()) return "Tell us your country.";
    return null;
  }, [values]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return false;
    }
    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        full_name: values.fullName.trim(),
        date_of_birth: values.dateOfBirth,
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        country: values.country.trim(),
        city: values.city.trim() || null,
        gender: values.gender || null,
        marketing_opt_in: values.marketingOptIn,
        email_verified_at: emailVerified ? new Date().toISOString() : null,
      },
      { onConflict: "user_id" }
    );
    if (error) {
      toast.error("Could not save your details", { description: error.message });
      return false;
    }
    return true;
  }, [user, values, validate, emailVerified]);

  const resendEmailVerification = useCallback(async () => {
    const email = values.email.trim() || user?.email;
    if (!email) return;
    setBusy("email");
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(null);
    if (error) toast.error("Could not send verification email", { description: error.message });
    else toast.success("Verification email sent", { description: `Check ${email}.` });
  }, [values.email, user]);

  const sendSmsCode = useCallback(async () => {
    const phone = values.phone.trim();
    if (!E164.test(phone)) {
      toast.error("Enter your phone in international format, e.g. +14155550123.");
      return;
    }
    setBusy("sms");
    const { error } = await supabase.auth.updateUser({ phone });
    setBusy(null);
    if (error) {
      toast.error("Could not send SMS code", { description: error.message });
      return;
    }
    setOtpSent(true);
    toast.success("Code sent", { description: `We texted a 6-digit code to ${phone}.` });
  }, [values.phone]);

  const verifySmsCode = useCallback(async () => {
    const phone = values.phone.trim();
    if (otpCode.trim().length < 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setBusy("verify");
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otpCode.trim(),
      type: "phone_change",
    });
    if (error) {
      setBusy(null);
      toast.error("Code didn't match", { description: error.message });
      return;
    }
    const now = new Date().toISOString();
    if (user) {
      await supabase
        .from("user_profiles")
        .upsert({ user_id: user.id, phone, phone_verified_at: now }, { onConflict: "user_id" });
    }
    setPhoneVerifiedAt(now);
    setOtpSent(false);
    setOtpCode("");
    setBusy(null);
    toast.success("Phone verified ✅");
  }, [values.phone, otpCode, user]);

  return {
    values,
    set,
    save,
    validate,
    emailVerified,
    phoneVerified,
    resendEmailVerification,
    sendSmsCode,
    verifySmsCode,
    otpSent,
    otpCode,
    setOtpCode,
    busy,
    age: ageFromDob(values.dateOfBirth),
  };
}

export type IdentityDossier = ReturnType<typeof useIdentityDossier>;
