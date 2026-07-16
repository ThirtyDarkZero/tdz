// Ambient types for MCP tool bundle. The generated Deno function reads
// `process.env` via a shim; declare it here so Vite typecheck is happy without
// pulling in @types/node for the whole app.
declare const process: { env: Record<string, string | undefined> };
