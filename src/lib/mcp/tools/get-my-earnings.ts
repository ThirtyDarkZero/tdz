declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "get_my_earnings",
  title: "Get my earnings",
  description:
    "Return the signed-in artist's total streaming revenue, download revenue, total streams, and pending vs paid payout amounts.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input: Record<string, never>, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("artist_earnings")
      .select("streaming_revenue, download_revenue, total_streams, payout_status")
      .eq("user_id", ctx.getUserId());
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const rows = data ?? [];
    const summary = rows.reduce(
      (acc, r: any) => {
        const stream = Number(r.streaming_revenue ?? 0);
        const dl = Number(r.download_revenue ?? 0);
        acc.streaming_revenue += stream;
        acc.download_revenue += dl;
        acc.total_streams += Number(r.total_streams ?? 0);
        if (r.payout_status === "paid") acc.paid_payouts += stream + dl;
        else acc.pending_payouts += stream + dl;
        return acc;
      },
      {
        streaming_revenue: 0,
        download_revenue: 0,
        total_streams: 0,
        pending_payouts: 0,
        paid_payouts: 0,
      },
    );
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
