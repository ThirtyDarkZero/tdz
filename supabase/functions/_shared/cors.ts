// Shared CORS configuration for Edge Functions
// Origin allow-list + strict fallback (no ACAO when origin isn't trusted)

const LOVABLE_PROJECT_ID = '751ec7fc-ab3c-47c5-ae43-f222950f0df1';

const ALLOWED_ORIGINS = [
  'https://tdz.lovable.app',
  'https://www.thirtydarkzero.net',
  'https://thirtydarkzero.net',
  'https://www.thirtydarkzero.com',
  'https://thirtydarkzero.com',
  // iOS app (Capacitor serves the bundled site from these origins)
  'capacitor://localhost',
  'ionic://localhost',
];

// Own domains only. Lovable hosts are matched by project id below, so other
// apps hosted on lovable.app (including copycats) are not trusted.
const ALLOWED_ORIGIN_SUFFIXES = [
  '.thirtydarkzero.net',
  '.thirtydarkzero.com',
];

// Extra origins (e.g. your Vercel URL) without a code change:
// set ALLOWED_ORIGINS="https://tdz.vercel.app,https://app.example.com"
function extraOrigins(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',').map((o) => o.trim()).filter(Boolean);
}

const ALLOWED_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-cron-secret',
  'x-supabase-client-platform',
  'x-supabase-client-platform-version',
  'x-supabase-client-runtime',
  'x-supabase-client-runtime-version',
].join(', ');

// Minimum methods actually used by the app. Individual functions can override.
const ALLOWED_METHODS = 'GET, POST, OPTIONS';

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:54321',
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const isDev = Deno.env.get('ENVIRONMENT') === 'development';
  const list = [...ALLOWED_ORIGINS, ...extraOrigins(), ...(isDev ? DEV_ORIGINS : [])];
  if (list.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    // Lovable editor previews for THIS project only.
    if (/\.(lovable\.app|lovable\.dev|lovableproject\.com)$/.test(host) && host.includes(LOVABLE_PROJECT_ID)) {
      return true;
    }
    return ALLOWED_ORIGIN_SUFFIXES.some((s) => host.endsWith(s));
  } catch {
    return false;
  }
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  // Only advertise ACAO for trusted origins. Untrusted callers get no ACAO
  // and the browser blocks them — no silent misattribution.
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin as string;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

// Fully public endpoints (read-only, no credentials). Still constrained methods.
export const publicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  'Access-Control-Allow-Methods': ALLOWED_METHODS,
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight
export function handleCorsPreflightWithOrigin(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
  }
  return null;
}
