#!/usr/bin/env bash
# Runs the payout, audit, quality and ledger migrations on a throwaway Postgres
# and checks their behaviour. Usage: PGHOST=... PGPORT=... PGUSER=... ./run.sh
set -euo pipefail
shopt -s lastpipe
cd "$(dirname "$0")"
MIG=../../migrations
psql() { command psql -X -q -v ON_ERROR_STOP=1 "$@"; }
psql -c "DROP DATABASE IF EXISTS tdz_test" -d postgres
psql -c "CREATE DATABASE tdz_test" -d postgres
export PGDATABASE=tdz_test
export PGOPTIONS="-c client_min_messages=warning"
psql -f 00_platform_stubs.sql
psql -f 01_base_schema.sql
for m in 20261027120000_fix_artist_payouts 20261027130000_six_sigma_audit_fixes \
         20261027140000_quality_measurement 20261027150000_money_ledger \
         20261027160000_db_security_fixes 20261027170000_quality_alerts \
         20261027180000_fraud_controls; do
  # SKIP="<migration>" proves a test fails without its fix.
  [[ " ${SKIP:-} " == *" $m "* ]] && { echo "skipped $m"; continue; }
  # pg_cron / pg_net aren't on plain Postgres; their calls are stubbed above.
  grep -v "CREATE EXTENSION" "$MIG/$m.sql" | psql -o /dev/null
  echo "applied $m"
done
psql -o /dev/null -f 10_assertions.sql 2>&1 | sed -E "s/^psql:[^ ]+ (NOTICE|ERROR): +//"

# Team and roster invites
psql -f 02_invites_base.sql
for m in 20261030120000_team_invites 20261030130000_smart_links 20261030140000_auto_lyrics 20261030150000_presave_signup 20261030160000_splits_pipeline; do
  [[ " ${SKIP:-} " == *" $m "* ]] && { echo "skipped $m"; continue; }
  psql -o /dev/null -f "$MIG/$m.sql"
  echo "applied $m"
done
psql -o /dev/null -f 20_invites_assertions.sql 2>&1 | sed -E "s/^psql:[^ ]+ (NOTICE|ERROR): +//"
echo "ALL DB TESTS PASSED"
