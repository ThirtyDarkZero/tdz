# Delete account, payout fix, and shortfall report

## 1. Delete digzmediagrp@gmail.com (confirmed: everything)
- Look up the account by email, then list everything it owns: songs, albums, profile, gallery, posts.
- Remove their uploaded files from storage (audio, track files, covers, artist/gallery/post images, videos), in folders named with their account ID and any paths recorded in their song/album rows.
- Delete the account itself. Linked rows are removed automatically, and any leftover rows owned by the account are cleaned up.
- Report counts of what was removed.

## 2. Payout fix (written new, since the file didn't exist)
Make payouts consistent and safe, adding things only (no data dropped):
- Mark an earnings row as paid only when its linked payout completes. Reset it to unpaid if the payout fails or is reversed.
- Block payouts with a zero or negative amount.
- Add a uniqueness rule so the same earnings row can't sit in two active payouts.
- Add indexes on artist and status to speed up the payout runs.
- Record the payout fix as a database update in the project.

## 3. Apply all database updates
- Every existing update is already applied. Only the new payout fix gets applied.

## 4. Shortfall report and CSV
- Save the report as a project file. Per artist it shows: total earned, total paid out (completed), pending/processing, failed, and the **shortfall** (earned minus paid minus in flight).
- Run it and export the results to `artist_shortfall_report.csv` in Files.

## Technical notes
- Tables: `artist_earnings` (total_earnings, payout_status), `artist_payouts` (amount, status, earnings_ids[]).
- Fix is a trigger on `artist_payouts` status change plus a CHECK on amount > 0. Before adding the CHECK, existing rows are validated.
- Deleting the user goes through the managed auth admin API. Files are removed through the storage API.
