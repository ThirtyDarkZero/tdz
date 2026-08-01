import { supabase } from "@/integrations/supabase/client";

export type AppEmailTemplate =
  | "welcome"
  | "track-uploaded"
  | "release-live"
  | "weekly-stats";

/**
 * Fire-and-forget app email. Never throws — email failures must not break UX.
 */
export async function sendAppEmail(params: {
  templateName: AppEmailTemplate;
  recipientEmail: string;
  idempotencyKey: string;
  templateData?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: params.templateName,
        recipientEmail: params.recipientEmail,
        idempotencyKey: params.idempotencyKey,
        templateData: params.templateData ?? {},
      },
    });
    if (error) console.warn(`[email] ${params.templateName} failed`, error);
  } catch (e) {
    console.warn(`[email] ${params.templateName} threw`, e);
  }
}
