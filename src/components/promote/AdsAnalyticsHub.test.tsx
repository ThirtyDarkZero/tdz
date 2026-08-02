import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFakeSupabase } from "@/test/fakeSupabase";

const USER_ID = "11111111-1111-1111-1111-111111111111";

let db: ReturnType<typeof createFakeSupabase>;
let currentUser: { id: string } | null = { id: USER_ID };

vi.mock("@/integrations/supabase/client", () => ({
  get supabase() {
    return db as any;
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({ user: currentUser }),
}));

const toastCalls: Record<string, string[]> = { success: [], error: [], info: [] };
vi.mock("sonner", () => ({
  toast: {
    success: (m: string) => toastCalls.success.push(m),
    error: (m: string) => toastCalls.error.push(m),
    info: (m: string) => toastCalls.info.push(m),
  },
}));

// Imported after the mocks so the component picks them up.
const { AdsAnalyticsHub } = await import("@/components/promote/AdsAnalyticsHub");

const PROVIDERS = [
  { id: "google_ads", name: "Google Ads", primaryId: "123-456-7890" },
  { id: "meta_ads", name: "Meta Ads (Facebook & Instagram)", primaryId: "1234567890123456" },
  { id: "tiktok_ads", name: "TikTok Ads", primaryId: "C4A1B2C3D4E5F6G7H8" },
  { id: "google_analytics", name: "Google Analytics 4", primaryId: "G-ABCDE12345" },
];

function cardFor(name: string) {
  const heading = screen.getByRole("heading", { name });
  // heading -> text column -> flex row -> card
  return heading.closest(".glass-card") as HTMLElement;
}

async function connectProvider(name: string, primaryId: string, secondary?: string) {
  const user = userEvent.setup();
  const card = cardFor(name);
  await user.click(within(card).getByRole("button", { name: /connect|update/i }));
  const dialog = await screen.findByRole("dialog");
  const inputs = within(dialog).getAllByRole("textbox");
  await user.clear(inputs[0]);
  await user.type(inputs[0], primaryId);
  if (secondary) await user.type(inputs[1], secondary);
  await user.click(within(dialog).getByRole("button", { name: /save & connect/i }));
}

beforeEach(() => {
  currentUser = { id: USER_ID };
  db = createFakeSupabase(USER_ID);
  toastCalls.success = [];
  toastCalls.error = [];
  toastCalls.info = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdsAnalyticsHub integration", () => {
  it("loads with every ads provider available to connect", async () => {
    render(<AdsAnalyticsHub />);
    for (const p of PROVIDERS) {
      expect(await screen.findByRole("heading", { name: p.name })).toBeInTheDocument();
    }
  });

  for (const p of PROVIDERS) {
    it(`connects, persists, updates, and disconnects ${p.id} end to end`, async () => {
      const user = userEvent.setup();
      render(<AdsAnalyticsHub />);
      await screen.findByRole("heading", { name: p.name });

      // CONNECT
      await connectProvider(p.name, p.primaryId, "extra-id");
      await waitFor(() => {
        const row = (db as any).__rows.find((r: any) => r.provider === p.id);
        expect(row).toBeTruthy();
        expect(row.manager_id).toBe(USER_ID);
        expect(row.status).toBe("active");
        expect(row.config).toEqual({ primary_id: p.primaryId, secondary: "extra-id" });
      });
      expect(toastCalls.error).toHaveLength(0);

      // Reflected in the UI as connected
      await waitFor(() => {
        expect(within(cardFor(p.name)).getByText(/connected/i)).toBeInTheDocument();
      });
      expect(within(cardFor(p.name)).getByText(p.primaryId)).toBeInTheDocument();

      // UPDATE (same provider, no duplicate row)
      await connectProvider(p.name, `${p.primaryId}-v2`);
      await waitFor(() => {
        const rows = (db as any).__rows.filter((r: any) => r.provider === p.id);
        expect(rows).toHaveLength(1);
        expect(rows[0].config.primary_id).toBe(`${p.primaryId}-v2`);
      });

      // DISCONNECT
      await user.click(within(cardFor(p.name)).getByRole("button", { name: /disconnect/i }));
      await waitFor(() => {
        expect((db as any).__rows.filter((r: any) => r.provider === p.id)).toHaveLength(0);
      });
      await waitFor(() => {
        expect(within(cardFor(p.name)).getByRole("button", { name: /^connect$/i })).toBeInTheDocument();
      });
      expect(toastCalls.error).toHaveLength(0);
    });
  }

  it("keeps each provider's record isolated when all three ads platforms are connected", async () => {
    render(<AdsAnalyticsHub />);
    await screen.findByRole("heading", { name: "Google Ads" });

    for (const p of PROVIDERS.slice(0, 3)) {
      await connectProvider(p.name, p.primaryId);
      await waitFor(() =>
        expect((db as any).__rows.find((r: any) => r.provider === p.id)).toBeTruthy(),
      );
    }

    const rows = (db as any).__rows;
    expect(rows).toHaveLength(3);
    expect(rows.map((r: any) => r.provider).sort()).toEqual([
      "google_ads",
      "meta_ads",
      "tiktok_ads",
    ]);
    for (const p of PROVIDERS.slice(0, 3)) {
      expect(rows.find((r: any) => r.provider === p.id).config.primary_id).toBe(p.primaryId);
    }
    expect(toastCalls.error).toHaveLength(0);
  });

  it("falls back to an in-place update when upsert hits a duplicate key", async () => {
    db = createFakeSupabase(USER_ID);
    render(<AdsAnalyticsHub />);
    await screen.findByRole("heading", { name: "Meta Ads (Facebook & Instagram)" });

    await connectProvider("Meta Ads (Facebook & Instagram)", "1111");
    await waitFor(() => expect((db as any).__rows).toHaveLength(1));

    // Simulate the conflict path PostgREST can surface on re-save.
    (db as any).__forceConflict = true;
    const original = (db as any).from;
    (db as any).from = (t: string) => {
      const q = original.call(db, t);
      const upsert = q.upsert;
      q.upsert = async (payload: any) => {
        await upsert.call(q, payload, {}); // wrong onConflict -> duplicate key error
        return {
          data: null,
          error: { code: "23505", message: "duplicate key value violates unique constraint" },
        };
      };
      return q;
    };

    await connectProvider("Meta Ads (Facebook & Instagram)", "2222");
    await waitFor(() => {
      const rows = (db as any).__rows;
      expect(rows).toHaveLength(1);
      expect(rows[0].config.primary_id).toBe("2222");
    });
    expect(toastCalls.error).toHaveLength(0);
  });

  it("surfaces an error instead of writing when the write fails", async () => {
    db = createFakeSupabase(USER_ID, { failWith: "permission denied for table" });
    render(<AdsAnalyticsHub />);
    await screen.findByRole("heading", { name: "TikTok Ads" });

    await connectProvider("TikTok Ads", "C4A1");
    await waitFor(() => expect(toastCalls.error).toContain("Could not save integration"));
    expect((db as any).__rows).toHaveLength(0);
  });

  it("blocks saving when there is no live session", async () => {
    db = createFakeSupabase(null);
    currentUser = null;
    render(<AdsAnalyticsHub />);
    await screen.findByRole("heading", { name: "Google Ads" });

    await connectProvider("Google Ads", "123-456-7890");
    await waitFor(() =>
      expect(toastCalls.error).toContain("Please sign in again to save this integration"),
    );
    expect((db as any).__rows).toHaveLength(0);
  });

  it("builds UTM tracking links for each ads platform", async () => {
    const user = userEvent.setup();
    render(<AdsAnalyticsHub />);
    await screen.findByRole("heading", { name: "Google Ads" });

    await user.type(screen.getByLabelText("Destination URL"), "tdz.lovable.app/track/abc");
    const sourceInput = screen.getByLabelText("Source");
    const mediumInput = screen.getByLabelText("Medium");
    await user.type(screen.getByLabelText("Campaign Name"), "summer_release_2026");

    for (const [source, medium] of [
      ["google", "cpc"],
      ["meta", "paid_social"],
      ["tiktok", "paid_social"],
    ]) {
      await user.clear(sourceInput);
      await user.type(sourceInput, source);
      await user.clear(mediumInput);
      await user.type(mediumInput, medium);

      await waitFor(() => {
        const link = screen.getByText(/^https:\/\/tdz\.lovable\.app\/track\/abc\?/);
        const url = new URL(link.textContent!);
        expect(url.searchParams.get("utm_source")).toBe(source);
        expect(url.searchParams.get("utm_medium")).toBe(medium);
        expect(url.searchParams.get("utm_campaign")).toBe("summer_release_2026");
        expect(url.searchParams.get("utm_content")).toBe("tdz_promote");
      });
    }
  });
});
