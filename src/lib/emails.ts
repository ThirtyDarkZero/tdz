import { supabase } from "@/integrations/supabase/client";

export type AppEmailTemplate =
  | "welcome"
  | "track-uploaded"
  | "release-live"
  | "weekly-stats"
  | "tutorial-first-upload"
  | "tutorial-smart-link"
  | "tutorial-payouts"
  | "tutorial-discovery";

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

/**
 * Event-triggered tutorial email. Sends at most once per user per tutorial —
 * the idempotency key is derived from the user id + template name.
 */
export async function sendTutorialEmail(params: {
  templateName: AppEmailTemplate;
  userId: string;
  recipientEmail: string;
  templateData?: Record<string, unknown>;
}): Promise<void> {
  await sendAppEmail({
    templateName: params.templateName,
    recipientEmail: params.recipientEmail,
    idempotencyKey: `${params.templateName}-${params.userId}`,
    templateData: params.templateData ?? {},
  });
}
