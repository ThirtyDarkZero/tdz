# Releasing TDZ

How changes reach production without lowering quality. Pairs with the CI
quality gate (`.github/workflows/quality-gate.yml`).

## 1. Every change

1. Work on a branch, never directly on `main`.
2. Open a pull request. CI runs four checks: app build/tests, edge function
   tests, database tests, and "no new defects" against the code it replaces.
3. Merge only when all four are green.
4. Apply any new files in `supabase/migrations/` (in filename order).
5. After deploy, check the **Quality (Six Sigma)** tab on the CEO dashboard.

Lovable commits straight to `main`; CI still checks those commits and shows
a red X when one adds defects. Once you stop editing in Lovable, turn on
GitHub branch protection for `main` (Settings → Branches → require the four
"Quality gate" checks) so nothing merges without passing.

## 2. Applying migrations

On Lovable Cloud, ask Lovable to apply the migration file by name. Apply in
filename order; each one is safe to re-run. Migrations only move forward: to
undo one, write a new migration that reverses it.

## 3. One-time setup after the Six Sigma pull requests merge

Merge order: #1 → #2 → #3 → #4 → #5 → #6 → #7 → #8 → #9 → this PR (each
builds on the one before).

| Setting | Where | Why |
| --- | --- | --- |
| Apply migrations `20261027120000` … `20261027180000` | Lovable | Payouts, security, scorecard, ledger, alerts, fraud limits |
| `OPENROUTER_API_KEY` | Edge function secrets | AI features fail over if Lovable's AI is down or out of credits |
| `ALERT_WEBHOOK_URL` (optional) | Edge function secrets | Quality alerts also post to Slack |
| `ALLOWED_ORIGINS` | Edge function secrets | Your Vercel/custom domain, comma-separated |
| `CRON_SECRET` + vault secret `payout_cron_secret` (same value, optional) | Secrets + SQL | Extra lock on scheduled jobs |
| Stripe webhook: listen to **Connected accounts** events | Stripe Dashboard | Artist payout readiness |

Then verify:

- `select jobname, schedule from cron.job;` lists `scheduled-artist-payouts`,
  `financial-reconciliation`, `quality-alerts`.
- `supabase/reports/db_security_check.sql` returns no rows you didn't expect.
- `supabase/reports/artist_shortfall_report.sql` → decide on make-good payouts;
  `supabase/reports/backfill_unpaid_tips.sql` pays verified historical tips.

## 4. Staging (recommended before leaving Lovable)

1. Create a second Supabase project for staging.
2. Apply all migrations there first; run the app against it via Vercel
   preview deployments (set the three `VITE_SUPABASE_*` variables for the
   Preview environment to the staging project).
3. Promote to production only after staging looks right on the Quality tab.

## 5. Rollback

- Code: `git revert <merge commit>` on a branch → PR → merge.
- Database: add a reversing migration (never edit or delete an applied one).
- Money: the ledger is append-only; correct balances with an `adjustment`
  entry, never by editing earnings or payouts.

## 6. Dependencies on Lovable

| Dependency | Fallback in place |
| --- | --- |
| AI gateway (21 functions) | OpenRouter failover via `_shared/aiFallback.ts` when `OPENROUTER_API_KEY` is set; `LOVABLE_API_KEY=none` skips Lovable entirely |
| Google/Apple sign-in broker (`src/integrations/lovable`) | None yet; move to Supabase Auth providers before leaving |
| Transactional email (`LOVABLE_SEND_URL`, email functions) | None yet; needs an email provider (e.g. Resend/Postmark) |
| Database + functions hosting (Lovable Cloud) | Export to your own Supabase project (see staging) |
