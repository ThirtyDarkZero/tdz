/**
 * Minimal in-memory stand-in for the Lovable Cloud (PostgREST) client used by
 * integration tests. It reproduces the behaviour the app actually depends on:
 *  - RLS: rows are only visible/writable when manager_id === session user id
 *  - unique index on (manager_id, provider) -> upsert conflict handling
 *  - select / eq / in / upsert / update / delete chains returning { data, error }
 */

export interface FakeRow {
  id: string;
  manager_id: string;
  provider: string;
  display_name: string | null;
  status: string;
  config: any;
  credentials: any;
}

export interface FakeDbOptions {
  /** Force upsert to fail with a duplicate-key error to exercise the fallback path. */
  upsertConflict?: boolean;
  /** Force every write to fail with this message. */
  failWith?: string;
}

export function createFakeSupabase(userId: string | null, options: FakeDbOptions = {}) {
  const rows: FakeRow[] = [];
  let seq = 0;

  const rlsError = { code: "42501", message: "new row violates row-level security policy" };

  const visible = () => rows.filter((r) => r.manager_id === userId);

  function makeQuery(kind: "select" | "delete" | "update", patch?: Partial<FakeRow>) {
    const filters: Array<(r: FakeRow) => boolean> = [];

    const runner: any = {
      eq(col: keyof FakeRow, val: any) {
        filters.push((r) => r[col] === val);
        return runner;
      },
      in(col: keyof FakeRow, vals: any[]) {
        filters.push((r) => vals.includes(r[col] as any));
        return runner;
      },
      then(resolve: (v: any) => void, reject?: (e: any) => void) {
        try {
          resolve(runner._execute());
        } catch (e) {
          reject?.(e);
        }
      },
      _execute() {
        if (options.failWith) return { data: null, error: { message: options.failWith } };
        const matched = visible().filter((r) => filters.every((f) => f(r)));
        if (kind === "select") return { data: matched.map((r) => ({ ...r })), error: null };
        if (kind === "delete") {
          matched.forEach((r) => rows.splice(rows.indexOf(r), 1));
          return { data: null, error: null };
        }
        matched.forEach((r) => Object.assign(r, patch));
        return { data: null, error: null };
      },
    };
    return runner;
  }

  const client = {
    __rows: rows,
    auth: {
      getSession: async () => ({
        data: { session: userId ? { user: { id: userId } } : null },
        error: null,
      }),
    },
    from(table: string) {
      if (table !== "manager_integrations") throw new Error(`unexpected table ${table}`);
      return {
        select: (_cols?: string) => makeQuery("select"),
        update: (patch: Partial<FakeRow>) => makeQuery("update", patch),
        delete: () => makeQuery("delete"),
        async upsert(payload: any, opts?: { onConflict?: string }) {
          if (options.failWith) return { data: null, error: { message: options.failWith } };
          if (!userId || payload.manager_id !== userId) return { data: null, error: rlsError };
          const existing = rows.find(
            (r) => r.manager_id === payload.manager_id && r.provider === payload.provider,
          );
          if (existing) {
            if (options.upsertConflict || opts?.onConflict !== "manager_id,provider") {
              return {
                data: null,
                error: {
                  code: "23505",
                  message:
                    'duplicate key value violates unique constraint "manager_integrations_manager_provider_key"',
                },
              };
            }
            Object.assign(existing, payload);
            return { data: null, error: null };
          }
          rows.push({ id: `row_${++seq}`, ...payload });
          return { data: null, error: null };
        },
      };
    },
  };

  return client;
}
