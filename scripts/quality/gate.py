#!/usr/bin/env python3
"""No-new-defects gate (Six Sigma "Control").

Compares the changed code against the base it replaces and fails if any
measured defect count goes UP. Existing defects don't fail the build; new
ones do, so quality can only ratchet upward.

Measured per edge function: type errors, unauthenticated privileged access,
outbound calls without timeouts, raw error text sent to clients, unguarded
request parsing, PostgREST filter injection. Measured per frontend file:
ESLint errors.

Usage: python3 scripts/quality/gate.py <base-ref>      (e.g. origin/main)
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()
FN_DIR = "supabase/functions"


def sh(cmd, cwd=ROOT, check=False):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        sys.exit(f"command failed: {' '.join(cmd)}\n{r.stderr}")
    return r


def changed_files(base):
    out = sh(["git", "diff", "--name-only", f"{base}...HEAD"], check=True).stdout
    return [f for f in out.splitlines() if f]


def functions_affected(root, files):
    fns = set()
    shared_changed = [f for f in files if f.startswith(f"{FN_DIR}/_shared/")]
    for f in files:
        parts = f.split("/")
        if f.startswith(FN_DIR + "/") and len(parts) > 3 and not parts[2].startswith("_"):
            fns.add(parts[2])
    if shared_changed:
        names = [os.path.basename(s) for s in shared_changed]
        fdir = os.path.join(root, FN_DIR)
        for fn in os.listdir(fdir):
            d = os.path.join(fdir, fn)
            if fn.startswith("_") or not os.path.isdir(d):
                continue
            src = read_fn(root, fn)
            if any(n in src for n in names):
                fns.add(fn)
    return sorted(fns)


def read_fn(root, fn):
    d = os.path.join(root, FN_DIR, fn)
    if not os.path.isdir(d):
        return None
    src = ""
    for dp, _, fs in os.walk(d):
        for f in fs:
            if f.endswith((".ts", ".tsx")) and not f.endswith("_test.ts"):
                src += open(os.path.join(dp, f), encoding="utf-8").read() + "\n"
    return src


def verify_jwt(root, fn):
    cfg = open(os.path.join(root, "supabase/config.toml"), encoding="utf-8").read()
    m = re.search(r"\[functions\." + re.escape(fn) + r"\]\s*\n\s*verify_jwt\s*=\s*(\w+)", cfg)
    return (m.group(1) if m else "true") == "true"


def type_errors(root, fn):
    d = os.path.join(root, FN_DIR, fn)
    entry = os.path.join(d, "index.ts")
    if not os.path.exists(entry):
        return 0
    cmd = ["deno", "check", "--no-lock", "--quiet", entry]
    if os.path.exists(os.path.join(d, "deno.json")):
        cmd[2:2] = ["--config", os.path.join(d, "deno.json")]
    out = sh(cmd, cwd=d)
    text = re.sub(r"\x1b\[[0-9;]*m", "", out.stdout + out.stderr)
    errs = len(re.findall(r"TS\d+ \[ERROR\]", text))
    if out.returncode != 0 and errs == 0:
        return None  # couldn't load/resolve modules: not measurable, don't compare
    return errs


def function_metrics(root, fn):
    src = read_fn(root, fn)
    if src is None:
        return None
    gated = bool(re.search(
        r"auth\.getUser|getClaims|requireUser|requireAdminOrCron|requireCronSecret|constructEvent|"
        r"verifyWebhook|x-cron-secret|rateLimit\(|isAuthenticated\(", src))
    privileged = "SERVICE_ROLE" in src or "LOVABLE_API_KEY" in src or "STRIPE_SECRET_KEY" in src
    fetches = len(re.findall(r"\bfetch\(", src))
    has_timeout = bool(re.search(r"fetchTimeout\.ts|AbortSignal\.timeout|AbortController|signal:", src))
    return {
        "type_errors": type_errors(root, fn),
        "open_privileged_endpoint": int(not verify_jwt(root, fn) and privileged and not gated),
        "fetch_without_timeout": fetches if fetches and not has_timeout else 0,
        "raw_error_to_client": len(re.findall(
            r"JSON\.stringify\(\{\s*error:\s*(?:error|err|e)(?:\s+as\s+\w+)?\.message", src)),
        "unguarded_request_json": len(re.findall(r"await req\.json\(\)(?!\.catch)", src)),
        "filter_injection": len(re.findall(r"\.(?:or|filter)\(\s*`[^`]*\$\{(?!safe)[^`]*`", src)),
    }


def eslint_errors(root, files, eslint_bin):
    files = [f for f in files if os.path.exists(os.path.join(root, f))]
    if not files:
        return {}
    out = sh(["node", eslint_bin, "-f", "json", "--no-warn-ignored", *files], cwd=root)
    try:
        data = json.loads(out.stdout or "[]")
    except json.JSONDecodeError:
        sys.exit(f"eslint failed:\n{out.stderr[-2000:]}")
    return {os.path.relpath(d["filePath"], root): d["errorCount"] for d in data}


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "origin/main"
    files = changed_files(base)
    print(f"Comparing {len(files)} changed files against {base}\n")

    with tempfile.TemporaryDirectory() as tmp:
        base_root = os.path.join(tmp, "base")
        sh(["git", "worktree", "add", "--detach", base_root, base], check=True)
        try:
            regressions, improvements = [], []

            for fn in functions_affected(ROOT, files):
                head = function_metrics(ROOT, fn)
                if head is None:
                    continue  # function deleted: fewer defects
                before = function_metrics(base_root, fn) or {k: 0 for k in head}
                for k, v in head.items():
                    b = before.get(k, 0)
                    if v is None or b is None:
                        if v is None:
                            regressions.append(f"{fn}: {k} could not be measured (modules failed to load)")
                        continue
                    if v > b:
                        regressions.append(f"{fn}: {k} {b} -> {v}")
                    elif v < b:
                        improvements.append(f"{fn}: {k} {b} -> {v}")

            web = [f for f in files if f.startswith("src/") and f.endswith((".ts", ".tsx"))]
            if web:
                if not os.path.exists(os.path.join(base_root, "node_modules")):
                    os.symlink(os.path.join(ROOT, "node_modules"), os.path.join(base_root, "node_modules"))
                eslint_bin = os.path.join(ROOT, "node_modules/eslint/bin/eslint.js")
                head_l = eslint_errors(ROOT, web, eslint_bin)
                base_l = eslint_errors(base_root, web, eslint_bin)
                for f, v in head_l.items():
                    b = base_l.get(f, 0)
                    if v > b:
                        regressions.append(f"{f}: eslint errors {b} -> {v}")
                    elif v < b:
                        improvements.append(f"{f}: eslint errors {b} -> {v}")
        finally:
            sh(["git", "worktree", "remove", "--force", base_root])

    for line in improvements:
        print(f"  improved   {line}")
    for line in regressions:
        print(f"  REGRESSION {line}")
    if regressions:
        print(f"\nFAILED: {len(regressions)} new defect(s). Fix them or explain in the PR why the count must rise.")
        sys.exit(1)
    print(f"\nPASSED: no new defects ({len(improvements)} improvement(s)).")


if __name__ == "__main__":
    main()
